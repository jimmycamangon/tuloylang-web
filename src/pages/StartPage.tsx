import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import NavigationPage from "@/components/NavigationPage";

export default function StartPage() {

    const navigate = useNavigate()

    return (
        <>
            <NavigationPage showLinks={false} />
            <section className="min-h-screen flex items-center justify-center flex-col">
                <div className="text-center">
                    <h1 className="text-5xl font-black pb-4">Welcome to TuloyLang</h1>
                </div>

                <div className="flex flex-row items-center gap-2 justify-center md:justify-start">
                    <Button
                        className="cursor-pointer h-8 w-36 rounded-2xl text-xs transition-all duration-200 hover:scale-105 hover:shadow-md"
                        size="sm"
                        onClick={() => navigate("/dashboard")}
                    >
                        Continue
                    </Button>

                    <Button
                        className="cursor-pointer h-8 w-36 rounded-2xl text-xs bg-white text-black border border-black transition-all duration-200 hover:bg-black hover:text-white hover:scale-105 hover:shadow-md"
                        size="sm"
                    >
                        Import Data
                    </Button>
                </div>
            </section>
        </>
    );
}
