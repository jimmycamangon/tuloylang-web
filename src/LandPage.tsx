import NavigationPage from "./components/NavigationPage"
import Footer from "./components/Footer"
import { Button } from "./components/ui/button"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"

export default function LandPage() {




    return (
      <>
        <NavigationPage />
        {/* HERO PAGE */}
        <section className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col md:flex-row w-full max-w-6xl items-center justify-between px-6 gap-10">
            {/* LEFT */}
            <div className="flex flex-col p-4 pb-10 md:pb-24 text-center md:text-left">
              <h1 className="text-2xl md:text-4xl font-black leading-tight">
                Tuloy lang. Build consistency, one day at a time.
              </h1>

              <small className="pb-4 text-gray-600">
                Track habits, workouts, and discipline in one place.
              </small>

              <div className="flex flex-row gap-2 justify-center md:justify-start">
                <Button
                  className="cursor-pointer h-8 w-36 rounded-2xl text-xs transition-all duration-200 hover:scale-105 hover:shadow-md"
                  size="sm"
                >
                  Get Started
                </Button>

                <Button
                  className="cursor-pointer h-8 w-36 rounded-2xl text-xs bg-white text-black border border-black transition-all duration-200 hover:bg-black hover:text-white hover:scale-105 hover:shadow-md"
                  size="sm"
                >
                  View Preview
                </Button>
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex justify-center items-center">
              <img
                src="/TuloyLang.png"
                alt="Hero"
                className="w-[250px] md:w-[400px] lg:w-[500px] h-auto object-contain"
              />
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section className="flex flex-col items-center justify-center min-h-screen py-16" id="features">
          <div className="flex flex-col md:flex-row w-full max-w-6xl items-center justify-between px-6 gap-12">
            {/* LEFT (IMAGE / MOCKUP) */}
            <div className="flex justify-center items-center w-full md:w-1/2">
              <div className="w-[300px] md:w-[400px] lg:w-[500px] h-[200px] bg-gray-300 rounded-lg" />
            </div>

            {/* RIGHT (TEXT) */}
            <div className="flex flex-col w-full md:w-1/2 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-black mb-4">Features</h1>

              <ul className="space-y-2 text-gray-600">
                <li>✔ Habit Tracking</li>
                <li>✔ Streak System</li>
                <li>✔ Workout Logs</li>
                <li>✔ Progress Analytics</li>
              </ul>
            </div>
          </div>
        </section>

        {/* PREVIEW SECTION */}
        <section className="flex flex-col items-center justify-center py-16">
          <div className="w-full max-w-6xl px-6">
            {/* TITLE */}
            <h1 className="text-3xl md:text-4xl font-black mb-8 text-left">
              Preview
            </h1>

            {/* CAROUSEL */}
            <div className="flex justify-center">
              <Carousel className="w-full max-w-4xl">
                <CarouselContent>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <CarouselItem key={index}>
                      <div className="p-2">
                        <div className="w-full h-[250px] md:h-[350px] bg-gray-300 rounded-lg flex items-center justify-center">
                          <img
                            src="/TuloyLang.png"
                            alt="Preview"
                            className="max-h-full object-contain"
                          />
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>

                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="flex flex-col items-center justify-center py-24 text-center">
          <h2 className="text-xl md:text-2xl font-semibold mb-6">
            Start building your streak today.
          </h2>

          <Button
            className="cursor-pointer h-8 w-36 rounded-2xl text-xs transition-all duration-200 hover:scale-105 hover:shadow-md"
            size="sm"
          >
            Get Started
          </Button>
        </section>

        <Footer />
      </>
    );
}