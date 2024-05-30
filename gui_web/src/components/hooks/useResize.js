import { useState, useEffect } from "react";

/**
 * This hook is used for get the width of the window and update a component if the window get resized.
 * 
 * @returns [number] width of the screen
 */
const useResize = () =>{
    const [innerWidth, setInnerWidth] = useState(window.innerWidth);
    useEffect(() =>{
        const resize = () =>{
            setInnerWidth(window.innerWidth);
        }

        window.addEventListener("resize", resize)
        
        return () => {
            window.removeEventListener('resize', resize)
        }
    }, [])

    return [innerWidth];
}

export default useResize;