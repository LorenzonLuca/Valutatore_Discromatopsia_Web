import React from 'react';
import {Typography} from 'antd';
import { useTranslation } from 'react-i18next';
import useResize from './hooks/useResize';
import './css/DYImagesDisplay.css';

const { Title, Text} = Typography;

export default function DYImagesDisplay({images}) {
    const [innerWidth] = useResize();

    const { t } = useTranslation();
    const disc = [
        t("protanopia"),
        t("protanomaly"),
        t("deuteranopia"),
        t("deuteranomaly"),
        t("tritanopia"),
        t("tritanomaly"),
        t("achromatopsia"),
    ];

    return (
        <div className="imagesContainer">
            {images.map((image, index) => (
                <div key={index} className="imgContainer" style={{width: innerWidth > 768 ? "32%" : "100%"}}>
                    <img src={`data:image/jpeg;base64,${image.img}`} alt='generated' className='img'/>
                    <Text underline><Title level={innerWidth > 768 ? 2 : 3}>{disc[image.type]}</Title></Text>
                </div>
            ))}
        </div>
    )
}