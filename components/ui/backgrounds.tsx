export const TopographicBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="topo-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                    <path d="M0 100 C 20 0 50 0 100 100 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    <path d="M0 0 C 50 100 80 100 100 0 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#topo-pattern)" className="text-sky-500" />
        </svg>
    </div>
)

export const GridBackground = () => (
    <div className="absolute inset-0 bg-grid-pattern pointer-events-none" />
)

export const DotBackground = () => (
    <div className="absolute inset-0 bg-dot-pattern pointer-events-none mask-gradient" />
)
