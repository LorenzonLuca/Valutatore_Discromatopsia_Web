import React, {useState} from 'react';
import {Layout, Typography, Space, FloatButton,notification } from 'antd';
import Cookies from 'universal-cookie';
import DYHeader from '../components/DYHeader';
import DYImageProcessor from '../components/DYImageProcessor';
import DYHistory from '../components/DYHistory';
import { useTranslation } from 'react-i18next';
import './css/HomePage.css';

const {Title, Text} = Typography;
const {Content} = Layout;

export default function HomePage(){
    const cookies = new Cookies();
    const [reloadHistory, setReloadHistory] = useState(true);
    const { t } = useTranslation();
    const [api, notificationHolder] = notification.useNotification();

    const openNotification = (error) => {
        const errorText = (<Text type="danger">{error}</Text>)

        api.open({
            message: t("elaborate-error-title"),
            description: errorText,
            duration: 3,
            className: "notificationError"
        });
    };

    return (
        <Layout className="layoutStyle">
            <DYHeader />
            <Content className="contentStyle">
                {notificationHolder}
                <Space direction="vertical" className="stackItem">
                    <Title className="title">{t("title")}</Title>
                    <DYImageProcessor updateHistory={() => setReloadHistory(true)} setNotification={(error) => openNotification(t(error))}/>
                    {cookies.get("token") ? (
                        <DYHistory reload={reloadHistory} callbackReload={() => setReloadHistory(false)}/>
                    ):(
                        <Title level={5} className="title">{t("no-login-history")}</Title>
                    )}
                    <FloatButton.BackTop/>
                </Space>
            </Content>
        </Layout>
    );
}
