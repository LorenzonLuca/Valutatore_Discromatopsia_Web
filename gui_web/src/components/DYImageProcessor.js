import React, {useState} from 'react';
import {Upload, Checkbox, Button, Form, Typography, Space, Modal} from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import axios from 'axios';
import Cookies from 'universal-cookie';
import DYLoader from './DYLoader';
import DYImagesDisplay from './DYImagesDisplay';
import DYInformation from './DYInformation';
import { useTranslation } from 'react-i18next';
import './css/DYImageProcessor.css';
import ErrorHandler from '../models/Errorhandler';
import useResize from './hooks/useResize';
const { Dragger } = Upload;
const { Text } = Typography;

export default function DYImageProcessor({updateHistory = () => {}, setNotification = () => {}}) {
    const cookies = new Cookies();

    const [imageUrl, setImageUrl] = useState(null);
    const [loader, setLoader] = useState(false);
    const [generatedImages, setGeneratedImages] = useState([]);
    const [disableCheckBox, setDisableCheckBox] = useState(false);
    const [modalInfo, setModalInfo] = useState(false);
    const [validFile, setValidFile] = useState(true);
    const [innerWidth] = useResize();
    const { t } = useTranslation();
    const errorHandler = new ErrorHandler();

    const [form] = Form.useForm();

    const options = [
        {label: t('protanopia'),value: 0,},
        {label: t('protanomaly'),value: 1,},
        {label: t('deuteranopia'),value: 2,},
        {label: t('deuteranomaly'),value: 3,},
        {label: t('tritanopia'),value: 4,},
        {label: t('tritanomaly'),value: 5,},
        {label: t('achromatopsia'),value: 6,},
    ]

    const getBase64 = (img, callback) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => callback(reader.result));
        reader.readAsDataURL(img);
    };
    const validateFile = (file) => {
        const isValidFile = file.type === 'image/jpeg' || file.type === 'image/png';
        // if (!isValidFile) {
        //     setFileFormatError(t(errorHandler.handle("Wrong-File-Format")));
        // }
        setValidFile(isValidFile);
        return isValidFile;
    };

    const handleChange = (info) => {
        if(validateFile(info.file)){
            if (info.file.status === 'uploading') {
                return;
            }
            if (info.file.status === 'done') {
                getBase64(info.file.originFileObj, (url) => {
                    setImageUrl(url);
                });
            }
        }
    };

    //upload photo without send a request
    //Source: https://stackoverflow.com/questions/51514757/action-function-is-required-with-antd-upload-control-but-i-dont-need-it
    const dummyRequest = async ({ file, onSuccess }) => {    
        setTimeout(() => {
            onSuccess("ok");
        }, 0);
    }

    const onFinish = async (values)  =>{
        let types = values.types;
        let all = values.allValues;

        if(imageUrl === null){
            setNotification(errorHandler.handle("No-Image-Selected"));
            return;
        }

        if((types !== undefined && types.length > 0)|| all !== undefined){
            if(all){
                types=[0,1,2,3,4,5,6];
            }
            const blob = await fetch(imageUrl).then(res => res.blob());

            var bodyFormData = new FormData();
            types.forEach(type => {
                bodyFormData.append("types", type);                
            });
            bodyFormData.append("img", blob);

            const config = {
                method: "post",
                data: bodyFormData,
                headers: { "Content-Type": "multipart/form-data" },
            }

            if(cookies.get("token") !== undefined){
                config["url"] = process.env.REACT_APP_SERVER_URL+ "/generate";
                config["auth"] = {username: cookies.get("token"),password: "unused"}
            }else{
                config["url"] = process.env.REACT_APP_SERVER_URL+ "/generatenoaccount";
            }          
            
            setLoader(true)
            axios(config)
            .then((response) => {
                if(response.data.status === "OK"){
                    setGeneratedImages(response.data.images);
                    setLoader(false);
                    updateHistory();
                }else{
                    setNotification(errorHandler.handle(response.data.message));
                    setLoader(false);
                    resetFields();
                }
            })
            .catch((err) => {
                console.err(err.message);
            });
        }else{
            setNotification(errorHandler.handle("No-Elaboration-Type"));
        }
    }

    const onChangeAll = (checkbox) =>{
        setDisableCheckBox(checkbox.target.checked);
    }

    const resetFields = () =>{
        form.resetFields(["types", "allValues"]);
        setGeneratedImages([]);
        setImageUrl(null);
        setDisableCheckBox(false);
        setValidFile(true);
    }

    return (
        <div className="container">
            <Form autoComplete='off' name='img' layout='vertical' onFinish={onFinish} form={form}>
                <div className="uploader">
                    {!loader ? (
                        <>
                        {generatedImages.length > 0 ? (
                            <DYImagesDisplay images={generatedImages} />
                        ):(
                            <Dragger onChange={handleChange} customRequest={dummyRequest} showUploadList={false}>
                                <div className="containerUploader">
                                    {imageUrl ? (
                                        <img src={imageUrl} alt="uploaded" className="imageUpload"/>
                                    ) : (
                                        <Space direction="vertical">
                                            <p className="ant-upload-drag-icon">
                                                <InboxOutlined />
                                            </p>
                                            <p>{t("select-img")}</p>
                                            {!validFile && (
                                                <Text type='danger'>{t(errorHandler.handle("Wrong-File-Format"))}</Text>
                                            )}
                                        </Space>
                                    )}
                                </div>
                            </Dragger>
                        )}
                        </>
                    ):(
                        <div className="loaderContainer">
                            <DYLoader />                        
                        </div>
                    )}
                </div>
                {innerWidth > 768 ? (
                    <div className="selector">
                        <Form.Item name="types">
                            <Checkbox.Group options={options} disabled={disableCheckBox}/>
                        </Form.Item>
                        <Form.Item name="allValues" valuePropName="checked">
                            <Checkbox onChange={onChangeAll}>{t("all-effect")}</Checkbox>
                        </Form.Item>
                        <Button className="buttonInfo" onClick={() => setModalInfo(true)}>{t("info")}</Button>
                        <Modal open={modalInfo} title={t("info")} onCancel={() => setModalInfo(false)} footer={[
                            <Button key="submit" type='primary' onClick={() => setModalInfo(false)}>OK</Button>
                        ]}>
                            <DYInformation />
                        </Modal>
                        {generatedImages.length === 0 ? (
                            <Button type="primary" className="sendButton" htmlType="submit">{t("generate-img")}</Button>
                        ):(
                            <></>
                        )}
                        {generatedImages.length > 0 && (
                            <Button className="resetButton" onClick={() => resetFields()}>{t("generate-img-new")}</Button>
                        )}
                    </div>
                ):(
                    <>
                        <div className="selector">
                            <Form.Item name="types">
                                <Checkbox.Group options={options} disabled={disableCheckBox}/>
                            </Form.Item>
                            <Form.Item name="allValues" valuePropName="checked">
                                <Checkbox onChange={onChangeAll}>{t("all-effect")}</Checkbox>
                            </Form.Item>
                        </div>
                        <Button className="buttonInfo" onClick={() => setModalInfo(true)}>{t("info")}</Button>
                        <Modal open={modalInfo} title={t("info")} onCancel={() => setModalInfo(false)} footer={[
                            <Button key="submit" type='primary' onClick={() => setModalInfo(false)}>OK</Button>
                        ]}>
                            <DYInformation />
                        </Modal>
                        {generatedImages.length === 0 ? (
                            <Button type="primary" className="sendButton" htmlType="submit">{t("generate-img")}</Button>
                        ):(
                            <></>
                        )}
                        {generatedImages.length > 0 && (
                            <Button className="resetButton" onClick={() => resetFields()}>{t("generate-img-new")}</Button>
                        )}
                    </>
                )}
            </Form>
        </div>
    );
}