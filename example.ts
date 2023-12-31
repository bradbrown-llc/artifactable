/*
    Example usage of artifact()
    This is a mock of how one would use it to compile an EVM contract
    
    trigger's first check is if $hp exists
    where $hp is a path to a file containing the output of 'md5deep -r $cd'
    where $cd is the directory of our contract
    trigger's second check is if 'md5deep -r $cd -x $hp' has any output
    this would indicate that the directory has changed
    so, if we don't have a hash of our contract directory
    or the current hash doesn't match the existing one,
    then trigger is true
    
    acquire concurrently compiles the contract and caches the contract directory
    the artifact returned is whatever the contents of our 'contract' are split by spaces
    (returns a string array)
    it simulates a slow compiling with a 2 second delay
    
    carves[0] creates a file foo.x with the first word from our artifact string array
    carves[1] creates a file foo.y with the second word from our artifact string array
    
    calling 'artifact({ trigger, acquire, carves, lock })'
    or rather running this file causes us to 'compile the contract' and extract some data from it
    only if we need to
    and avoiding race conditions while doing so 
    
*/

import artifact from './artifact.ts'

const artifactableDir = Deno.env.get('ARTIFACTABLE')
if (!artifactableDir) throw '!artifactableDir'
const cacheDir = `${artifactableDir}.cache`
const hashPath = `${cacheDir}/foo.md5`
const xPath = `${cacheDir}/foo.x`
const yPath = `${cacheDir}/foo.y`
const contractsDir = `${artifactableDir}/contracts`
const contractDir = `${contractsDir}/foo`
const contractPath = `${contractDir}/foo.sol`
const lock = `${cacheDir}/foo.lock`

const trigger = async () => {
    const stat = await Deno.stat(hashPath).catch(() => null)
    if (!stat) return true
    const args = ['-r', contractDir, '-x', hashPath]
    const command = new Deno.Command('md5deep', { args })
    const { stdout: { length } } = await command.output()
    return !!length
}

const compile = async () => {
    await new Promise(r => setTimeout(r, 2000))
    const text = await Deno.readTextFile(contractPath)
    return text.split(' ')
}

const cache = async () => {
    const args = ['-r', contractDir]
    const command =  new Deno.Command('md5deep', { args })
    const { stdout } = await command.output()
    await Deno.writeFile(hashPath, stdout)
}

const acquire = async () => {
    return (await Promise.all([compile(), cache()]))[0]
}

const fn0 = async ([x, _]:string[]) => {
    const data = new TextEncoder().encode(x)
    await Deno.writeFile(xPath, data)
}

const fn1 = async ([_, y]:string[]) => {
    const data = new TextEncoder().encode(y)
    await Deno.writeFile(yPath, data)
}

const carves = [fn0, fn1]

artifact({ trigger, acquire, carves, lock })