import NavigationPage from "./components/NavigationPage"
import { Button } from "./components/ui/button"

export default function LandPage () {
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
                View Demo
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
        </>
    )
}