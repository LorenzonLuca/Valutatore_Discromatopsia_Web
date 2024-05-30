import React from 'react';
import { Link } from 'react-router-dom';
import {Layout, Button, Typography, Space, Tooltip } from 'antd';
import { MdExitToApp } from "react-icons/md";
import Cookies from 'universal-cookie';
import './css/DYHeader.css';
import { useTranslation } from 'react-i18next';
import DYLanguageSelector from './DYLanguageSelector';

const {Header} = Layout;
const {Text} = Typography;

export default function DYHeader() {
    const cookies = new Cookies();
    const showButton = !(cookies.get("token"));
    const { t } = useTranslation();

    const signOut = () =>{
        cookies.remove('token', { path: '/' });
        window.location.reload(false);
    }

    return(
        <Header className="headerStyle">
            <DYLanguageSelector />
            <Space>
                {showButton ? (
                    <Space>
                        <Link to="/login">
                            <Button type='text' size='large' className="button">{t("sign-in")}</Button>
                        </Link>
                        <Link to="/register">
                            <Button size='large' className="button">{t("sign-up")}</Button>
                        </Link>
                    </Space>
                ) : (
                    <div className='account'>
                        <Text>{cookies.get("username")}  </Text>
                        <MdExitToApp onClick={() => signOut()} size={20} color='red'/>
                    </div>            
                )}
                <Tooltip placement='bottom' title={t("about-site")}>
                    <Button size='large' className="button" shape='circle' type='text'>i</Button>
                </Tooltip>
            </Space>
        </Header>
    );
}
