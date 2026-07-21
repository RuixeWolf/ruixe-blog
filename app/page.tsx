import { Button } from '@heroui/react'
import { ArrowRight, Calendar, FileText, Home as HomeIcon, Rocket } from 'lucide-react'

/**
 * Home page showcasing HeroUI components and Lucide icon integration.
 */
export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans ">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between gap-12 py-32 px-16 bg-white dark:bg-black sm:items-start">
        <section className="flex flex-col items-center gap-2 sm:items-start">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">HeroUI smoke test</span>
          <Button variant="primary">HeroUI Button</Button>
        </section>

        <section className="flex flex-col items-center gap-4 sm:items-start">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">Lucide icons</span>
          <div className="flex items-center gap-4 text-zinc-700 dark:text-zinc-300">
            <HomeIcon className="size-5" />
            <FileText className="size-5" />
            <Calendar className="size-5" />
            <Rocket className="size-5" />
          </div>
        </section>

        <section className="flex flex-col items-center gap-4 sm:items-start">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">HeroUI + Lucide</span>
          <div className="flex flex-wrap items-center gap-3">
            <Button>
              <Rocket className="size-4" />
              Launch
            </Button>
            <Button variant="secondary">
              <FileText className="size-4" />
              Read post
            </Button>
            <Button variant="ghost">
              Read more
              <ArrowRight className="size-4" />
            </Button>
            <Button isIconOnly variant="tertiary" aria-label="Home">
              <HomeIcon className="size-4" />
            </Button>
          </div>
        </section>
      </main>
    </div>
  )
}
