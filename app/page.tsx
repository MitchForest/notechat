import { getCurrentUser } from "@/lib/auth/session";
import LandingPage from "@/components/layout/landing-page";
import CanvasView from "@/components/layout/canvas-view";

export default async function RootPage() {
    const user = await getCurrentUser();

    if (user) {
        return <CanvasView />;
    }

    return <LandingPage />;
} 