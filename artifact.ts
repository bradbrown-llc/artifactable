// 'artifacts' some resource
// o is an options object containing the following properties:
// o.lock - string - a path to a lock dir mutex for artifact to use
// o.trigger - () => Promise<boolean>
//     a boolean function
//     if false, aborts
//     if true, executes acquire then each carve against acquire's artifact
// o.acquire - () => Promise<A>
//     a function that returns an artifact
//     could be anything
// o.carves - ((a:A) => Promise<void>)[]
//     an array of functions that operate on an artifact
const artifact:Artifact = async (o) => {
    const fn:Foo = async () => {
        return await Deno.mkdir(o.lock)
            .then(() => null)
            .catch(async () => {
                try { 
                    const watcher = Deno.watchFs(o.lock)
                    for await (const _event of watcher) break
                } catch (_) {0}
                return () => fn()
            })
    }
    let thunk = await fn()
    while (typeof thunk == 'function') thunk = await thunk()
    if (await o.trigger()) {
        const a = await o.acquire()
        for (const carve of o.carves)
            carve(a)
    }
    await Deno.remove(o.lock)
}
export default artifact