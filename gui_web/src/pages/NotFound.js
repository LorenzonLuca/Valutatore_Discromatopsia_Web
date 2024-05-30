import React from 'react';
import {Typography, Space } from 'antd';
import { Link } from 'react-router-dom';
import './css/HomePage.css';
import { useTranslation } from 'react-i18next';

const {Title} = Typography;

export default function NotFound(){
    const { t } = useTranslation();

    return(
        <div className='contentNotFound'>
            <Space direction='vertical' size='large'>
                <Title>{t('page-not-found-title')}</Title>
                <Link to={'/'}>
                    <label>{t('page-not-found-content')}</label>
                </Link>
            </Space>
        </div>
    )
}