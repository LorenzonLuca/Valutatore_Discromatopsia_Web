import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout, Typography, Form, Input, Space, Button, notification  } from 'antd';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import './css/Auth.css';
import DYLanguageSelector from '../components/DYLanguageSelector';
import ErrorHandler from '../models/Errorhandler';

const { Content } = Layout;
const { Title, Text } = Typography;

export default function SignUp() {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [api, notificationHolder] = notification.useNotification();
    const { t } = useTranslation();
    const errorHandler = new ErrorHandler();

    //(?=.*[0-9]) --> at least one number
    //(?=.*[!@#$%^&*]) --> at least one special char
    //[a-zA-Z0-9!@#$%^&*] --> valid character
    //{6,} --> max 6 character
    const validatePassword = new RegExp("^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,}$");

    const openNotification = (error) => {
        const errorText = (<Text type="danger">{error}</Text>)

        api.open({
            message: t("sign-up-error-title"),
            description: errorText,
            duration: 3,
            className: "notificationError"
        });
    };

    const onFinish = (values) => {
        const username = values.username.trim();
        const password = values.password.trim();
        const passwordConfirm = values.passwordConfirm.trim();

        if(username.length > 4){
            if(username.length < 21){        
                if (password === passwordConfirm) {
                    var bodyFormData = new FormData();
                    bodyFormData.append("username", username);
                    bodyFormData.append("password", password);
                    if(validatePassword.test(password)){
                        axios({
                            method: "post",
                            url: process.env.REACT_APP_SERVER_URL + "/createuser",
                            data: bodyFormData,
                            headers: { "Content-Type": "multipart/form-data" },
                        })
                        .then((response) => {
                            if (response.data.status === "OK") {
                                navigate('/login');
                            }else{
                                openNotification(t(errorHandler.handle(response.data.message, form)));
                            }
                        })
                        .catch((err) => {
                            console.err(err.message);
                        });
                    }else{
                        openNotification(t(errorHandler.handle("Password-Invalid", form)));
                    }
                }
            }else{
                openNotification(t(errorHandler.handle("Username-long", form)));
            }
        }else{
            openNotification(t(errorHandler.handle("Username-short", form)));
        }
    }

    return (
        <Layout style={{ height: "100vh" }}>
            <Content className="content">
                {notificationHolder}
                <DYLanguageSelector topleft={true} />
                <Space direction="vertical" align="center">
                    <Title>{t("sign-up-title")}</Title>
                    <div className="formContainer">
                        <Form autoComplete='off' name='register' layout='vertical' onFinish={onFinish} form={form}>
                            <Form.Item label={t("username")} name="username" rules={[{ required: true, message: t("username-error")}]}>
                                <Input size='large' className="inputText" />
                            </Form.Item>
                            <Form.Item label={t("password")} name="password" rules={[{ required: true, message: t("password-error") }]}>
                                <Input.Password size='large' className="inputText" />
                            </Form.Item>
                            <Form.Item label={t("confirm-password")} name="passwordConfirm" rules={[
                                { required: true, message: t("confirm-password-error") },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error(t("confirm-password-error-match")));
                                    },
                                }),
                            ]}>
                                <Input.Password size='large' className="inputText" />
                            </Form.Item>
                            <div className="submitDiv">
                                <Form.Item>
                                    <Button type="primary" htmlType="submit" size='large'>{t("sign-up")}</Button>
                                </Form.Item>
                            </div>
                        </Form>
                        <div className="noAccount">
                            <Space direction='vertical'>
                                <Text>{t("already-account")}
                                    <Link to="/login">
                                        <label> {t("sign-in")}</label>
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
