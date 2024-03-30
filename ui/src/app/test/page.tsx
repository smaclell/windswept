import { Tile } from "../game/tile";

export default function Home() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>Test Page</h1>
      <p>This is the test page to help validate each component and tricky scenarios</p>
      <section className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h2>Tiles</h2>
        <div className="flex flex-wrap">
          <Tile state="hidden" mineCount={0} />
          <Tile state="flag" mineCount={0} />
          <Tile state="mine" mineCount={0} />
          <Tile state="explosion" mineCount={0} />
        </div>
        <div className="flex flex-wrap">
          <Tile state="visible" mineCount={0} />
          <Tile state="visible" mineCount={1} />
          <Tile state="visible" mineCount={2} />
          <Tile state="visible" mineCount={3} />
          <Tile state="visible" mineCount={4} />
          <Tile state="visible" mineCount={5} />
          <Tile state="visible" mineCount={6} />
          <Tile state="visible" mineCount={7} />
          <Tile state="visible" mineCount={8} />
        </div>
      </section>
      <section className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h2>Section Interactions</h2>
      </section>
    </main>
  )
}
