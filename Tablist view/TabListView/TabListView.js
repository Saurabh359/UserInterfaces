import React, { useEffect, useState } from "react";
import { useHistory } from 'react-router-dom';
import './tablistview.scss';
import RedFlag from  '../../assets/icons-emoji_flag.svg';
import ApiService from "../../helper/api.service";
import { getFormatedDate } from "../../helper/util.service";

export function TabListView(props){
    
    const history = useHistory();
    const [sample,setSample] = useState({});
    const [loginData, setLogin] = useState({});
    const [sampleTab, setSampleTab] = useState(0);

    let received_data = props.sampleDetails;
    let logInData = props.loginData;
    let sample_focused = props.sampleTab;
    let samples_data = {};
    let initialData = {};
    
    if(received_data !=null && received_data.samples !=null && received_data.samples.length !=null){
        initialData = received_data.samples.find(f => f.sample_id == (sampleTab || sample_focused)) || {};
        let temp_sorted_data = received_data.samples.sort((a, b) => parseInt(b.sample_id) - parseInt(a.sample_id) );
        received_data.samples = temp_sorted_data;
        samples_data = received_data;
    }

    useEffect(()=>{
        setSample(initialData);
    },[props.sampleDetails]);

    useEffect(()=>{
        setSampleTab(sample_focused);
    },[props.sampleTab]);
    
    useEffect(()=>{
        setLogin(logInData);
    },[props.loginData]);

    const tabClick = (id) =>{
        samples_data.samples.forEach(d=>{
            document.getElementById(d.sample_id+"tab").classList.remove("active");
        });
        
        document.getElementById(id).classList.add("active");
        let tab_value= parseInt(id.replace("tab",""));
        let temp_sam = samples_data.samples.find(f => f.sample_id == tab_value);
        setSample(temp_sam);
        setSampleTab(tab_value);
    }

    const checkIn = async(sample_number) =>{
        console.log("MAKE AN API CALL TO CHECK IN THE SAMPLE with userDetails : ",loginData.username);

        let sample_entry = samples_data.samples.find(f => f.sample_id == sample_number);
        sample_entry.sample_status = 'sample.inprogress';
        sample_entry.checked_in_by = loginData.username || '';
        sample_entry.checked_in_at = getFormatedDate(new Date().toUTCString());

        try{
            let response = await new ApiService().postJson('sample/v1/checkin/',sample_entry);
            history.push({
                pathname:'/', state: {showAlert:true, alertType:"success", alertMessage: "Sample checked in!"}
            })
        }
        catch(e){
            console.log('Check IN Failed');
        }
    }

    const displayStat = (str) => {
        if(str == "sample.open") return "Open";
        if(str == "sample.inprogress") return "In Progress";
        if(str == "sample.closed") return "Closed";
        return str;
    }

    return(
        <div id="top-page">
            <div className="tab-container">
                {
                    (samples_data.samples || []).map(s =>{
                        return(
                            <div key={s.sample_id+"tab"} id={s.sample_id+"tab"} className={(s.sample_id == ( sampleTab ||sample_focused))?"tab-item active":"tab-item"} onClick={()=>tabClick(s.sample_id+"tab")}>
                                {s.tab_title}
                            </div>
                        );
                    })
                }
            </div>
            <div className="tab-data-container">
                <div className="sample-details-container">
                    <div className="first-row">
                        <div className="dcol-1">
                            <b>Status</b>
                            <div className="status-detail">
                                <span style={{backgroundColor : (sample.sample_status == "sample.inprogress")?"#F0AD4E":(sample.sample_status == "sample.closed")?"#5CB85C":"#999"}}></span>
                                <p>{displayStat(sample.sample_status) || "-"}</p>
                            </div>
                            <div className="status-alert" style={{ display : (sample.qc_wait)?"flex":"none" }}>
                                <img src={RedFlag} />
                                <p style={{color:"#D9534F"}}>wait for QC</p>
                            </div>    
                        </div>
                        <div className="dcol-2">
                            <div className="sample-result">
                                <b>Result</b>
                                <p>{sample.sample_result || ""}</p>
                            </div>
                            <div className="sample-buttons">
                                <div className="checkin-btn"
                                     onClick={()=>{checkIn(sample.sample_id);}}
                                     style={{display : (sample.sample_status == "sample.open" && (loginData || {}).loggedIn)?"block":"none"}}>Check-in</div>
                            </div>
                        </div>
                    </div>
                    <div className="second-row">
                        <div className="grid-box">
                            <div>
                                <p>Sample No.</p>
                                <div className="sample_column_row">
                                    <p>{sample.sample_id || "-"}</p>
                                    <span style={{ display : (sample.sample_redo)?'flex':'none' }}>Redo</span>
                                </div>
                            </div>
                            <div>
                                <p>Mixing Batch No.</p>
                                <p>{sample.tab_title || "-"}</p>
                            </div>
                            <div>
                                <p>Sample Type</p>
                                <p>{sample.sample_type || "-"}</p>
                            </div>
                            <div>
                                <p>Machine</p>
                                <p>{sample.machine || "-"}</p>
                            </div>
                            <div>
                                <p>Sample In</p>
                                <p>{sample.created_at || "-"}</p>
                                <p>{sample.created_by || "-"}</p>
                            </div>
                            <div>
                                <p>Check In</p>
                                <p>{sample.checked_in_at || "-"}</p>
                                <p>{sample.checked_in_by || "-"}</p>
                            </div>
                            <div>
                                <p>Check Out</p>
                                <p>{sample.checked_out_at || "-"}</p>
                                <p>{sample.checked_out_by || "-"}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}