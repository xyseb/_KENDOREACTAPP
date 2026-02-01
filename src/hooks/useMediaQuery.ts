import { useState, useEffect } from "react";

/** Type d'un MediaQuery */
type MediaQuery =
{
    IsSmall: boolean
    IsAboveSmall: boolean
    IsMedium: boolean
    IsAboveMedium: boolean
    IsLarge: boolean
    IsAboveLarge: boolean
    IsVerticalSmall: boolean
    IsVerticalAboveSmall: boolean
    IsVerticalMedium: boolean
    IsVerticalAboveMedium: boolean
    IsTouchScreen: boolean
}

// Media queries breakpoints
// En cohérence avec ceux définis en scss dans MediaQueries.scss
// Small screen / tablet
const screenSmall: number = 768;
// (horizontal) Medium screen / desktop
const screenMedium: number = 992;
// (horizontal) Large screen / wide desktop
const screenLarge: number = 1200;
// (vertical) Small screen / tablet
const screenVerticalSmall: number = 768;
// (vertical) Medium screen / desktop
const screenVerticalMedium: number = 1024;

const detectMediaQuery = (): MediaQuery => ({
    IsSmall: window.matchMedia(`only screen and (max-width: ${screenSmall}px)`).matches,
    IsAboveSmall: window.matchMedia(`only screen and (min-width: ${screenSmall}px)`).matches,
    IsMedium: window.matchMedia(`only screen and (max-width: ${screenMedium}px)`).matches,
    IsAboveMedium: window.matchMedia(`only screen and (min-width: ${screenMedium}px)`).matches,
    IsLarge: window.matchMedia(`only screen and (max-width: ${screenLarge}px)`).matches,
    IsAboveLarge: window.matchMedia(`only screen and (min-width: ${screenLarge}px)`).matches,
    IsVerticalSmall: window.matchMedia(`only screen and (max-height: ${screenVerticalSmall}px)`).matches,
    IsVerticalAboveSmall: window.matchMedia(`only screen and (min-height: ${screenVerticalSmall}px)`).matches,
    IsVerticalMedium: window.matchMedia(`only screen and (max-height: ${screenVerticalMedium}px)`).matches,
    IsVerticalAboveMedium: window.matchMedia(`only screen and (min-height: ${screenVerticalMedium}px)`).matches,
    IsTouchScreen: window.matchMedia('only screen and (hover: none)').matches
});

/**
 * Permet de connaitre le type d'écran
 * @returns IMediaQuery indiquant le type d'écran
 */
export const useMediaQuery = (): MediaQuery =>
{
    const [mediaQuery, setMediaQuery] = useState(detectMediaQuery);

    useEffect(() =>
    {
        const onResize = (): void =>
        {
            setMediaQuery(detectMediaQuery);
        };

        window.addEventListener("resize", onResize);

        return () =>
        {
            window.removeEventListener("resize", onResize);
        };
    }, []);

    return mediaQuery;
};