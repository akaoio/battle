/**
 * Battle Replay System
 * Records and replays terminal sessions like StarCraft replays
 */

import { constructor } from './constructor.js'
import { record } from './record.js'
import { save } from './save.js'
import { load } from './load.js'
import { play } from './play.js'
import { exportReplay } from './export.js'
import type { ReplayData, ReplayEvent } from '../types/index.js'

export class Replay {
    data!: ReplayData
    events!: ReplayEvent[]
    startTime!: number
    
    constructor() {
        constructor.call(this)
    }
    
    record(event: ReplayEvent) {
        return record.call(this, event)
    }
    
    save(path: string) {
        return save.call(this, path)
    }
    
    load(path: string) {
        return load.call(this, path)
    }
    
    async play(options?: any) {
        return play.call(this, options)
    }
    
    export(format: 'json' | 'html') {
        return exportReplay.call(this, format)
    }
}

export default Replay