import React from 'react';
import './css/DYLoader.css';

/* Animation from:
    https://uiverse.io/Shoh2008/selfish-crab-11 
    https://uiverse.io/PriyanshuGupta28/calm-earwig-94
*/

export default function DYLoader({small = false, type = ""}) {

    switch(type){
        default:
            return (
                <div className={small ? "loadersmall" : "loader"}></div>
            )
        case "spinner":
            return (
                <div className="spinner">
                    <div></div>   
                    <div></div>    
                    <div></div>    
                    <div></div>    
                    <div></div>    
                    <div></div>    
                    <div></div>    
                    <div></div>    
                    <div></div>    
                    <div></div>    
                </div>
            )
    }
}