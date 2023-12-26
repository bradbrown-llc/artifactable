type Opts<A> = {
    lock:string
    trigger:() => Promise<boolean>,
    acquire:() => Promise<A>,
    carves:((a:A) => Promise<void>)[]
}

type Artifact = <A>(o:Opts<A>) => Promise<void>

type Foo = () => Promise<Foo|null>