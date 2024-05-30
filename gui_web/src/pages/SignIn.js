import React from 'react';
import { Link, useNavigate} from 'react-router-dom';
import {Layout, Typography, Form, Input, Space, Button, notification } from 'antd';
import Cookies from 'universal-cookie';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import './css/Auth.css';
import DYLanguageSelector from '../components/DYLanguageSelector';
import ErrorHandler from '../models/Errorhandler';

const {Content} = Layout;
const { Title, Text } = Typography;

export default function SignIn() {
    const navigate = useNavigate();
    const cookies = new Cookies();
    const [api, notificationHolder] = notification.useNotification();
    const [form] = Form.useForm();
    const { t } = useTranslation();
    const errorHandler = new ErrorHandler();

    const openNotification = (error) => {
        const errorText = (<Text type="danger">{error}</Text>)

        api.open({
            message: t("sign-in-error-title"),
            description: errorText,
            duration: 3,
            className: "notificationError"
        });
    };

    const onFinish = (values) =>{
        const username = values.username.trim();
        const password = values.password.trim();

        axios({
            method: "get",
            url: process.env.REACT_APP_SERVER_URL+"/login",
            headers: { 
                "Content-Type": "multipart/form-data",
            },
            auth:{
                username: username,
                password: password
            }
        })
        .then((response) => {
            if(response.data.status === "OK"){
                cookies.set('token', response.data.token, { 
                    path: '/',
                    expires: new Date(new Date().getTime() + 1000 * 3600 * 24 * 30),
                });
                cookies.set('username', response.data.username, { 
                    path: '/',
                    expires: new Date(new Date().getTime() + 1000 * 3600 * 24 * 30),
                });
                navigate('/');
            }
        })
        .catch((err) => {
            if(err.response.status === 401){
                openNotification(t(errorHandler.handle("Incorrect-Login", form)));
            }
        });
    }

    return(
        <Layout style={{height:"100vh"}}>
            {/* <DYHeader showButton={false}/> */}
            <Content className="content">
                {notificationHolder}
                <DYLanguageSelector topleft={true}/>
                <Space direction="vertical" align="center">
                    <Title>{t("sign-in-title")}</Title>
                    <div className="formContainer">
                        <Form autoComplete='off' name='login' layout='vertical' onFinish={onFinish} form={form}>
                            <Form.Item label={t("username")} name="username" rules={[{required: true,message: t("username-error")}]}>
                                <Input size='large' className="inputText"/>
                            </Form.Item>
                            <Form.Item label={t("password")} name="password" rules={[{required: true,message: t("password-error")}]}>
                                <Input.Password size='large' className="inputText"/>
                            </Form.Item>
                            <div className="submitDiv">
                                <Form.Item>
                                    <Button type="primary" htmlType="submit" size='large'>{t("sign-in")}</Button>
                                </Form.Item>
                            </div>
                        </Form>
                        <div className="noAccount">
                            <Space direction='vertical'>
                                <Text>{t("no-account")}
                                    <Link to="/register">
                                        <label> {t("sign-up")}</label> 
                                    </Link>
                                </Text>
                                <Link to="/">
                                    <label>{t("guest")}</label>
                                </Link>
                            </Space>
                        </div>
                    </div>
                </Space>
            </Content>
        </Layout>
    );
}