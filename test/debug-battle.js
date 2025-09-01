#!/usr/bin/env node
/**
 * Debug Battle to see what's happening
 */

import { Battle } from '../dist/index.js'

async function debugBattle() {
    console.log('🔍 Debug Battle Test\n')
    
    try {
        const battle = new Battle({
            command: 'echo',
            args: ['Hello Battle'],
            timeout: 5000,
            debug: true // Enable debug mode if available
        })
        
        console.log('Spawning echo command...')
        await battle.spawn()
        
        console.log('Waiting 1 second for output...')
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        console.log('Taking screenshot...')
        const output = await battle.screenshot()
        console.log('Output captured:')
        console.log('---START---')
        console.log(output)
        console.log('---END---')
        
        console.log('\nTrying to match "Hello Battle"...')
        try {
            await battle.expect('Hello Battle')
            console.log('✅ Pattern matched!')
        } catch (e) {
            console.log('❌ Pattern not matched:', e.message)
            console.log('Raw output buffer:', JSON.stringify(output))
        }
        
        battle.cleanup()
        
    } catch (error) {
        console.error('❌ Error:', error.message)
        console.error(error.stack)
    }
}

debugBattle()