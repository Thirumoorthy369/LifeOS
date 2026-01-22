import gsap from 'gsap'

export const pageEnter = (element: HTMLElement) => {
    gsap.fromTo(
        element,
        {
            opacity: 0,
            y: 20
        },
        {
            opacity: 1,
            y: 0,
            duration: 0.4,
            ease: 'power2.out'
        }
    )
}

export const cardReveal = (elements: HTMLElement[], stagger = 0.1) => {
    gsap.fromTo(
        elements,
        {
            opacity: 0,
            y: 15
        },
        {
            opacity: 1,
            y: 0,
            duration: 0.3,
            stagger,
            ease: 'power2.out'
        }
    )
}

export const taskComplete = (element: HTMLElement, onComplete?: () => void) => {
    gsap.to(element, {
        scale: 0.95,
        opacity: 0.6,
        duration: 0.2,
        ease: 'power2.out',
        onComplete
    })
}

export const syncIndicator = (element: HTMLElement) => {
    gsap.to(element, {
        rotation: 360,
        duration: 1,
        repeat: -1,
        ease: 'linear'
    })
}

export const fadeIn = (element: HTMLElement, delay = 0) => {
    gsap.fromTo(
        element,
        { opacity: 0 },
        {
            opacity: 1,
            duration: 0.3,
            delay,
            ease: 'power2.out'
        }
    )
}
