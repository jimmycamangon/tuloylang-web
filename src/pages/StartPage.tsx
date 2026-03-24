import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import NavigationPage from '@/components/NavigationPage'
import { importAppData } from '../lib/appDataStorage'

export default function StartPage() {
    const navigate = useNavigate()
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const [feedback, setFeedback] = useState('')
    const [isImporting, setIsImporting] = useState(false)

    async function handleImportChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        if (!file) return

        setIsImporting(true)

        try {
            const fileText = await file.text()
            const importedData = importAppData(fileText)
            setFeedback(`Imported ${importedData.habits.length} habits successfully.`)
            navigate('/dashboard/habits')
        } catch {
            setFeedback('Import failed. Please choose a valid TuloyLang backup JSON file.')
        } finally {
            event.target.value = ''
            setIsImporting(false)
        }
    }

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
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isImporting}
                    >
                        {isImporting ? 'Importing...' : 'Import Data'}
                    </Button>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    onChange={handleImportChange}
                    className="hidden"
                />

                {feedback && (
                    <p className="mt-4 rounded-md border border-border bg-card px-4 py-2 text-sm text-foreground">
                        {feedback}
                    </p>
                )}
            </section>
        </>
    )
}
