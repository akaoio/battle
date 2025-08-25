#!/usr/bin/env node
import { Battle } from '../dist/index.js'

async function realTest() {
    console.log('Real Battle Test')
    
    try {
        const battle = new Battle({
            command: 'echo',
            args: ['Hello Battle'],
            timeout: 5000
        })
        
        await battle.spawn()
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Access output directly
        console.log('Output buffer:', battle.output || 'empty')
        
        // Try expect
        try {
            await battle.expect('Hello Battle')
            console.log('✅ Pattern matched!')
        } catch (e) {
            console.log('❌ Pattern not found')
        }
        
        battle.cleanup()
        
    } catch (error) {
        console.error('Error:', error.message)
    }
}

realTest()
