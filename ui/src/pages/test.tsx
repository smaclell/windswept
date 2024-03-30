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
      </section>
      <section className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h2>Section Interactions</h2>
      </section>
    </main>
  )
}
