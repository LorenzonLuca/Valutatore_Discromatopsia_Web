import React, {useState, useEffect} from "react";
import {Typography, Collapse, Divider, Card, Button} from 'antd';
import { DeleteTwoTone } from '@ant-design/icons';
import Cookies from 'universal-cookie';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import DYLoader from './DYLoader';
import useResize from "./hooks/useResize";
import "./css/DYHistory.css";

const {Text, Title} = Typography;

export default function DYHistory({reload = true, callbackReload = () => {}}){
    const cookies = new Cookies();
    const { t } = useTranslation();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dynamicLoad, setDynamicLoad] = useState(false);
    const [page, setPage] = useState(1);
    const [endHistory, setEndHistory] = useState(false);
    const [first, setFirst] = useState(false);
    const [innerWidth] = useResize();

    const removeAlbum = (id, index) =>{        
        var bodyFormData = new FormData();
        bodyFormData.append("id", id);

        axios({
            method: "delete",
            url: process.env.REACT_APP_SERVER_URL + "/remove",
            data: bodyFormData,
            headers: { "Content-Type": "multipart/form-data" },
            auth: {username: cookies.get("token"),password: "unused"}
        }).then((response) => {
            setHistory((history) => history.filter((_, n) => n !== index));
        })
        .catch((err) => {
            console.err(err.message);
        });
    }

    const fetchData = () =>{
        const token = cookies.get("token");
        axios({
            method: "get",
            url: process.env.REACT_APP_SERVER_URL + "/history/" + page,
            headers: { 
                "Content-Type": "multipart/form-data",
            },
            auth:{
                username: token,
                password: "unused"
            }
        })
        .then((response) => {
            if(response.data.status === "OK"){
                if(response.data.history !== undefined){
                    setHistory(prevHistory => [...prevHistory, ...response.data.history]);
                    setLoading(false);
                    setDynamicLoad(false);
                    if(response.data.history.length < 5){
                        setPage(0);
                        setEndHistory(true);
                    }
                }
            }else{
                setDynamicLoad(false);
            }
        })
        .catch((err) => {
            setDynamicLoad(false);
        });
    }

    useEffect(() => {
        if(reload){
            setPage(0);
            setHistory([]);
            setLoading(true);
            callbackReload();
            setEndHistory(false);
            setFirst(false);
        }
    },[reload]) 

    useEffect(() =>{
        if(page > 0){
            if(!endHistory){
                if(page === 1 ){
                    if(!first){
                        setFirst(true);
                        fetchData();
                    }else{
                        return;
                    }
                }else{
                    fetchData();
                }
            }
        }else{
            setPage(1);
        }
    }, [page])

    const HistoryValues = ({album, index}) =>{
        return (
            <div className="historyValues">
                {album.map((img, index) =>(
                    <Card title={t(img.type_dyschromatopsia)} bordered={true} key={(img.album_id + "")+ index} className={innerWidth > 768 ? "cardHistory" : "cardHistoryMobile"}>
                        <img src={`data:image/jpeg;base64,${img.ref_image}`} alt={img.type_dyschromatopsia} />
                    </Card>
                ))}
                <div className="removeContainer">
                    <Button onClick={() => removeAlbum(album[0].album_id, index)}>
                        <DeleteTwoTone twoToneColor={"red"}/>
                        <Text type="danger">{t("remove-item")}</Text>
                    </Button>
                </div>
            </div>
        )
    }

    const formatDate = (date) =>{
        var formattedDate = new Date(date);
        let year = formattedDate.getFullYear();
        let month = formattedDate.getMonth() + 1;
        let day = formattedDate.getDate();

        let res = year + "-" + month + "-" + day;

        return res;
    }

    useEffect(() => {
        const handleScroll = () =>{
            //calc for get if user has scrolled to the bottom of the page http://blog.sodhanalibrary.com/2016/08/detect-when-user-scrolls-to-bottom-of.html
            const windowHeight = "innerHeight" in window ? window.innerHeight : document.documentElement.offsetHeight;
            const body = document.body;
            const html = document.documentElement;
            const docHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight,  html.scrollHeight, html.offsetHeight);
            const windowBottom = windowHeight + window.pageYOffset;

            if (windowBottom >= docHeight ) {
                setDynamicLoad(true);
                setPage(prevPage => prevPage+1)
            }
        }
    
        window.addEventListener('scroll', handleScroll);
    
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return(
        <div className="containerHistory">
            <Title>{t("history")}</Title>
            {loading ? (
                <div className="loaderContainerHistory">
                    <DYLoader type="spinner"/>   
                </div>
            ):(
                <>
                    {history.length > 0 ? (
                        <div>
                            {history.map((album, index) => (
                                <div key={index}>
                                        <Collapse items={[{ 
                                            key: index, 
                                            label: <img 
                                                src={`data:image/jpeg;base64,${album.images[0].ref_image}`} 
                                                alt='generated' 
                                                className={innerWidth > 768 ? "imgTitle" : "imgTitleMobile"}/>, 
                                            children: <HistoryValues album={album.images} index={index}/>,
                                            extra: <Text>{formatDate(album.date_upload)}</Text>
                                        }]} />
                                        <Divider orientation="left" />
                                </div>
                            ))}
                            {(dynamicLoad && !endHistory)&& (
                                <div className="loaderContainerHistoryDynamic">
                                    <DYLoader type="spinner"/>   
                                </div>
                            )}
                        </div>
                    ):(
                        <Text>{t("history-no-values")}</Text>
                    )}
                </>
            )}
            
        </div>
    )

}