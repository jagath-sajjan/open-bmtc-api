"use client";
import { useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function Home() {
    const themeBtnRef = useRef<HTMLButtonElement | null>(null);
    const [theme, setTheme] = useState<"light" | "dark">("light");
    
    useEffect(() => {
        const saved = (localStorage.getItem("theme") as "light" | "dark" | null) ?? "light";
        setTheme(saved);
        document.documentElement.dataset.theme = saved;
    }, []);

    const toggleTheme = () => {
        const next = theme === "light" ? "dark" : "light";
        setTheme(next);
        document.documentElement.dataset.theme = next;
        localStorage.setItem("theme", next);
        const btn = themeBtnRef.current;
        if (btn) {
            btn.classList.remove("themeBtnBump");
            void btn.offsetWidth;
            btn.classList.add("themeBtnBump");
        }
    };

    const openEndpoint = (path: string) => {
        window.open(path, "_blank");
    };

    return (
        <main className={`page ${theme}`}>
            <section className={`card ${theme}`}>
                <div className="cardHeader">
                    <div className="titleRow">
                        <h1 className="title">BMTC Geo API</h1>
                        <button
                            type="button"
                            className="themeBtn"
                            aria-label="Toggle theme"
                            onClick={toggleTheme}
                            ref={themeBtnRef}
                        >
                            {theme === "dark" ? (
                                <>
                                    <span className={`themeIcon ${theme}`} aria-hidden="true">
                                        <Sun size={22} />
                                    </span>
                                    <span className="themeText">Light</span>
                                </>
                            ) : (
                                <>
                                    <span className={`themeIcon ${theme}`} aria-hidden="true">
                                        <Moon size={22} />
                                    </span>
                                    <span className="themeText">Dark</span>
                                </>
                            )}
                        </button>
                    </div>
                    <p className="sub">
                        Fast, bbox Filterd GeoJson Endpoints For Routes &amp; Stops
                    </p>
                </div>

                <div className="divider" />

                <h2>EndPoints</h2>

                <ul className="list">
                    <li>
                        <code onClick={() => openEndpoint("/api/bmtc/routes")} style={{ cursor: "pointer" }}>
                            /api/bmtc/routes
                        </code>
                    </li>
                    <li>
                        <code onClick={() => openEndpoint("/api/bmtc/stops")} style={{ cursor: "pointer" }}>
                            /api/bmtc/stops
                        </code>
                    </li>
                    <li>
                        <code onClick={() => openEndpoint("/api/bmtc/aggregated")} style={{ cursor: "pointer" }}>
                            /api/bmtc/aggregated
                        </code>
                    </li>
                </ul>

                <h2> Query Params</h2>
                <ul className="list">
                    <li>
                        <code>bbox=minLng,minLat,maxLng,maxLat</code>
                    </li>
                    <li>
                        <code onClick={() => openEndpoint("/api/bmtc/aggregated?routeId=258-C")} style={{ cursor: "pointer" }}>
                            routeId=258-C
                        </code>
                    </li>
                    <li>
                        <code onClick={() => openEndpoint("/api/bmtc/routes?simplify=0.0005")} style={{ cursor: "pointer" }}>
                            simplify=0.0005
                        </code>
                    </li>
                </ul>

                <div className="divider" />

                <p className="footer">
                    Built For Maps. Built For Speed. ~Jagath Sajjan 💖
                </p>

            </section>
        </main>
    );
}