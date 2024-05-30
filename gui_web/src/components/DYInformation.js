import React from "react";
import {Typography} from 'antd';
import { useTranslation } from 'react-i18next';
import "./css/DYInformation.css";
import original from '../img/InfoImg/original.jpg';
import achromatopsia from '../img/InfoImg/achromatopsia.jpg';
import deuteranomaly from '../img/InfoImg/deuteranomaly.jpg';
import deuteranopia from '../img/InfoImg/deuteranopia.jpg';
import protanomaly from '../img/InfoImg/protanomaly.jpg';
import protanopia from '../img/InfoImg/protanopia.jpg';
import tritanomaly from '../img/InfoImg/tritanomaly.jpg';
import tritanopia from '../img/InfoImg/tritanopia.jpg';

const {Text, Title} = Typography;

export default function DYInformation(){
    const { t } = useTranslation();

    const values = [
        {"name": "original", "img": original},
        {"name": "protanopia", "img": protanopia},
        {"name": "protanomaly", "img": protanomaly},
        {"name": "deuteranopia", "img": deuteranopia},
        {"name": "deuteranomaly", "img": deuteranomaly},
        {"name": "tritanopia", "img": tritanopia},      
        {"name": "tritanomaly", "img": tritanomaly},
        {"name": "achromatopsia", "img": achromatopsia},
    ]
    return (
        <div className="infoContainer">
            <Text>{t("info-intro")}</Text>
            {values.map((value, index)=>(
                <div key={index} className="infoValue">
                    <Title level={4}>{t(value.name)}</Title>
                    <img src={value.img}/>
                </div>
            ))}
        </div>
    )
}