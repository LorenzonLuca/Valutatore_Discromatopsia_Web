import React, {useEffect} from 'react'
import './App.css';
import { BrowserRouter, Routes, Route, redirect } from "react-router-dom";
import SignIn from './pages/SignIn';
import HomePage from './pages/HomePage';
import SignUp from './pages/SignUp';
import Cookies from 'universal-cookie';
import { useTranslation } from 'react-i18next';
import NotFound from './pages/NotFound';

export default function App() {
    const cookies = new Cookies();
    const { t, i18n } = useTranslation();

    useEffect(() => {
        if(cookies.get("lng")){
            i18n.changeLanguage(cookies.get("lng"));
        }else{
            i18n.changeLanguage("en");
            cookies.set('lng', "en", { 
                path: '/',
                expires: new Date(new Date().getTime() + 1000 * 3600 * 24 * 30),
            });
        }
    },[])

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />}/>
                <Route path="/login" element={<SignIn />}/>
                <Route path="/register" element={<SignUp />}/>
                <Route path='*' element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}
