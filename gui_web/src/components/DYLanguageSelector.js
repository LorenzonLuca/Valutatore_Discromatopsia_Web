import React, {useState, useEffect} from 'react';
import {Dropdown } from 'antd';
import Cookies from 'universal-cookie';
import { useTranslation } from 'react-i18next';
import italian from '../img/italian.png';
import english from '../img/english.png';

export default function DYLanguageSelector({topleft = false}){
    const cookies = new Cookies();
    const [language, setLanguage] = useState(<img src={english} alt="English" />);
    const { i18n } = useTranslation();

    const items = [
        {
            key: '1',
            label: (
                <img src={italian} alt="Italian" onClick={() => changeLanguage("it")}/>
            ),
        },
        {
            key: '2',
            label: (
                <img src={english} alt="English" onClick={() => changeLanguage("en")}/>
            ),
        },
    ]

    const changeLanguage = (lng) =>{
        i18n.changeLanguage(lng)
        cookies.set('lng', lng, { 
            path: '/',
            expires: new Date(new Date().getTime() + 1000 * 3600 * 24 * 30),
        });
        if(lng === "it"){
            setLanguage(<img src={italian} alt="Italian"/>)
        }else if(lng === "en"){
            setLanguage(<img src={english} alt="English"/>)
        }
    }

    useEffect(() =>{
        changeLanguage(cookies.get("lng"));
    }, [])

    return(
        <>
            {topleft ? (
                <div style={{position: "relative"}}>
                    <div style={{position: "absolute", top: "1.5vh", left: "1.5vw"}}>
                        <Dropdown menu={{items,}} placement="bottomLeft" arrow>
                            {language}
                        </Dropdown>
                    </div>
                </div>
            ):(
                <Dropdown menu={{items,}} placement="bottomLeft" arrow>
                    {language}
                </Dropdown>
            )}
        </>
    );
}