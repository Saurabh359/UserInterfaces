import React from 'react';
import { Component } from 'react';
import './sampleForm.scss';
import ArrowIcon from '../../assets/drop_down_arrow.svg';
import CheckIcon from '../../assets/icon-check.svg';
import CrossIcon from '../../assets/icon-cross.svg';
import ApiService from '../../helper/api.service';
import { Link } from "react-router-dom";

export class SampleForm extends Component{

    pos_num = this.props.initials.pos_number;
    sample_num = this.props.initials.sample_number;

    constructor(props){
        super(props);

        this.state = {
            searching_mixing_batch : '',
            pos_number : this.pos_num,
            sample_number : this.sample_num,
            wait_for_qc : false,
            sample_type : '',
            resubmit : false,
            redo : false,
            mixing_batch_number : '',
            production_personnel : '',
            mixing_batch : false,
            retint_shot_number : '',
            scale_up_shot_number : '',
            mixing_batch_list : [],
            sample_type_list : [
                                {title : 'Start up', value : 'start-up'},
                                {title : 'Post Blend', value : 'post-blend'},
                                {title : 'Post Production', value : 'post-production'},
                                {title : 'Retint', value : 'retint'},
                                {title : 'Scale Up', value : 'scale-up'},
                                {title : 'Start Up Resin for Medical', value : 'start-up-resin-for-medical'}
                               ],
            p_personnel_list : []
        }
    }

    async componentDidMount(){
        this.assignMixingBatches();
        await this.apiCalls();
    }

    assignMixingBatches = () =>{
        let temp_list = [{ title: 'TopUp', checked : false}];
        for(let j=1; j<100; j++){
            temp_list.push({ title : ''+j, checked : false});
        }
        this.setState({ mixing_batch_list : temp_list });
    }

    apiCalls = async() =>{
        let personnel_data = await new ApiService().getJson('personnel/v1');
        this.setState({ p_personnel_list : JSON.parse(JSON.stringify(personnel_data))})
    }

    handleSubmit = async(event) => {
        let data = JSON.parse(JSON.stringify(this.state));

        let sample_submit_data ={
            pos_number : data.pos_number,
            sample_id : data.sample_number,
            qc_wait : data.wait_for_qc,
            sample_type : data.sample_type,
            // sample_resubmit : data.resubmit,
            sample_redo : data.redo,
            // mixing_batch : data.mixing_batch,
            tab_title : data.mixing_batch_number,
            created_at : new Date().toUTCString(),
            created_by : data.production_personnel,
            // retint_shot_number : data.retint_shot_number,
            // scale_up_shot_number : data.scale_up_shot_number
        };

        let submit_samples =[sample_submit_data];

        try{
            let response = await new ApiService().postJson('sample/v1',submit_samples);
            console.log("SUBMIT : ",response);
            // this.props.history.push({
            //     pathname: '/sampleDetail/'+this.pos_num+'/'+this.sample_num, state: 'success'
            // });
            window.location.replace('/sampleDetail/'+this.pos_num+'/'+this.sample_num);
        }
        catch(e){
            alert("Sample Did not submited");
        }

    }

    handleChange = (event) => {
        let ele = event.target;
        
        if(ele.name == 'redo') this.setState({ redo : ele.checked });
        else if(ele.name == 'resubmit') this.setState({ resubmit : ele.checked });
        else if(ele.name == 'waitforQC') this.setState({ wait_for_qc : ele.checked });
        else if(ele.name == 'retintShotNumber') this.setState ({ retint_shot_number : ele.value});
        else if(ele.name == 'scaleUpShotNumber') this.setState ({ scale_up_shot_number : ele.value});
        else if(ele.name == 'mixingBatch') this.setState ({ mixing_batch : ele.checked});
        
        setTimeout(()=>{
            this.checkMandatoryFields();
        },0);
        
    }

    numberFieldKeyDown = (e) =>{
        let allowedList = ['0','1','2','3','4','5','6','7','8','9','Backspace'];
        if(!allowedList.includes(e.key))  
            e.preventDefault();
    }

    checkMandatoryFields = () =>{
        if(this.state.pos_number.trim().length != 0 &&
            this.state.sample_number.trim().length != 0 &&
            this.state.sample_type.trim().length != 0 &&
            this.state.mixing_batch_number.trim().length != 0 &&
            this.state.production_personnel.trim().length != 0)
        {
            if((this.state.sample_type == 'retint' && this.state.retint_shot_number.trim().length == 0) ||
                (this.state.sample_type == 'scale-up' && this.state.scale_up_shot_number.trim().length == 0)){

                document.getElementById('sample-submit-btn').classList.remove('active-submit');
                document.getElementById('sample-submit-btn').disabled = true;
            }
            else{
                document.getElementById('sample-submit-btn').classList.add('active-submit');
                document.getElementById('sample-submit-btn').disabled = false;
            }
        }
        else{
            document.getElementById('sample-submit-btn').classList.remove('active-submit');
            document.getElementById('sample-submit-btn').disabled = true;
        }
    }

    customSelectChange = ( field ,data) =>{
        if(field == 'mixing_batch'){
            let temp_mixing_list = this.state.mixing_batch_list;
            let temp_mixing_batch_number = '';

            temp_mixing_list.map( f => {
                if(f.title == data.title) f.checked = !f.checked;
                if(f.checked) temp_mixing_batch_number += f.title + ", ";
                return f;
            })

            temp_mixing_batch_number = temp_mixing_batch_number.substring(0, temp_mixing_batch_number.length - 2);

            this.setState({ mixing_batch_list : temp_mixing_list,
                            mixing_batch_number : temp_mixing_batch_number 
                        });
        }
        if(field == 'sample_type'){
            this.setState({ sample_type : data.value });
            
            if(data.value == 'retint') document.getElementById('retint-area').style.display = 'flex';
            else  document.getElementById('retint-area').style.display = 'none';
            
            if(data.value == 'scale-up') document.getElementById('scale-up-area').style.display = 'flex';
            else  document.getElementById('scale-up-area').style.display = 'none';
        }
        if(field == 'production_personnel'){
            this.setState({ production_personnel : data });
        }

        setTimeout(()=>{
            this.checkMandatoryFields();
        },0);
        
    }

    openPopUps = (id, img_id) => {
        let ele = document.getElementById(id);
        let img_ele = document.getElementById(img_id);
        if(ele){
            if(ele.style.display == "none" || ele.style.display == ''){
                ele.style.display = "block";
                img_ele.classList.add('reverse-arrow');
            }    
            else{
                ele.style.display = "none";
                img_ele.classList.remove('reverse-arrow');
            }
        }
        this.closePopUps(null,id);
    }
    
    closePopUps = (e,t) => {
        if(e) e.preventDefault();
        let ids = ['custom-mixing-batch-popup','custom-sample-type-popup','custom-pp-popup'];
        let img_ids = ['mixing-arrow','sample-type-arrow','pp-arrow'];
        ids.forEach((f,i)=>{
            if(f != t){
                let ele = document.getElementById(f);
                let img_ele = document.getElementById(img_ids[i]);
                if(ele){
                    ele.style.display = "none";
                    img_ele.classList.remove('reverse-arrow');
                }
            }
        })
    }

    displayName = (value,field) => {
        if(field == 'sample-type'){
            let temp =  (this.state.sample_type_list.find(p => p.value == value) || {} ).title || '';
            return temp;
        }
    }

    render(){
        return(
            <div id='sample-form-page' onClick={(e)=>this.closePopUps(e,'')}>
                <h2 className='head-title'>Submit sample</h2>
                <form className='sample-form' onSubmit={(e)=> e.preventDefault()}>
                    <label className='first-style'>
                        <p>POS No.</p>
                        <div className='second-style'>
                            <input value={this.state.pos_number} className='input-box' readOnly/>
                            <Link className='edit-link'  to={"/?pos_number="+this.state.pos_number+"&sample_id="+this.state.sample_number} >Edit</Link>
                        </div>
                    </label>
                    <label className='first-style'>
                        <p>Sample No.</p>
                        <div className='second-style'>
                            <input value={this.state.sample_number} className='input-box' readOnly/>
                            <Link className='edit-link'  to={"/?pos_number="+this.state.pos_number+"&sample_id="+this.state.sample_number} >Edit</Link>
                        </div>
                    </label>
                    <label className='second-style'>
                        <input type='checkbox' name='waitforQC' onClick={(e)=>e.stopPropagation()} onChange={this.handleChange}/>
                        <p>Wait for QC</p>
                    </label>
                    <label className='first-style'>
                        <p>Sample Type</p>
                        <div className='second-style select-container'>
                            <input value={this.displayName(this.state.sample_type,'sample-type')}  name='sampleType' className='input-box select-box' placeholder='Select' 
                                    onClick={(e)=> { e.preventDefault(); e.stopPropagation(); this.openPopUps('custom-sample-type-popup','sample-type-arrow')}} readOnly/>
                            <img id='sample-type-cross' src={CrossIcon} style={{display : (this.state.sample_type == '')?'none':'flex'}}  onClick={(e)=> { e.preventDefault(); e.stopPropagation(); this.customSelectChange('sample_type',{title : '', value : ''}); }}/>
                            <img id='sample-type-arrow' src={ArrowIcon} className='drop-down-arrow-img' onClick={(e)=> { e.preventDefault(); e.stopPropagation(); this.openPopUps('custom-sample-type-popup','sample-type-arrow')}}/>
                            <div id='custom-sample-type-popup' className='popup-choice-box'>
                                {
                                    this.state.sample_type_list.map((m) => 
                                        <div key={m.value} className='custom-select-option'
                                             style={{ borderRight : (this.state.sample_type_list.length < 6)?'none':'1px solid #ddd'}}
                                             onClick={() => this.customSelectChange( 'sample_type',m )}>
                                            <span>{m.title}</span>
                                        </div>
                                    )
                                }
                            </div>
                        </div>
                    </label>
                    <label className='second-style'>
                        <input type='checkbox' name='resubmit' onClick={(e)=>e.stopPropagation()} onChange={this.handleChange}/>
                        <p>This sample is a resubmit</p>
                    </label>
                    <label className='second-style'>
                        <input type='checkbox' name='redo' onClick={(e)=>e.stopPropagation()} onChange={this.handleChange}/>
                        <p>This sample is a redo</p>
                    </label>
                    <label id='retint-area' className='first-style'>
                        <p>Retint Shot No.</p>
                        <div className='second-style prefix-containers'>
                            <input type='number' name='retintShotNumber' min='0' onKeyPress={this.numberFieldKeyDown} className='input-box' onChange={this.handleChange}/>
                            <span>R-</span>
                        </div>
                    </label>
                    <label id='scale-up-area' className='first-style'>
                        <p>Scale Up Shot No.</p>
                        <div className='second-style prefix-containers'>
                            <input type='number' name='scaleUpShotNumber' min='0' onKeyDown={this.numberFieldKeyDown} className='input-box' onChange={this.handleChange}/>
                            <span>S-</span>
                        </div>
                    </label>
                    <label className='first-style'>
                        <p>Mixing Batch No.</p>
                        <p>Select all applicable mixing batches</p>
                        <div className='second-style select-container'>
                            <input value={this.state.mixing_batch_number}  name='mixingBatchNumber' className='input-box select-box' placeholder='Select' 
                                    onClick={(e)=> { e.preventDefault(); e.stopPropagation(); this.openPopUps('custom-mixing-batch-popup','mixing-arrow')}} readOnly/>
                            <img id='mixing-arrow' src={ArrowIcon} className='drop-down-arrow-img' onClick={(e)=> { e.preventDefault(); e.stopPropagation(); this.openPopUps('custom-mixing-batch-popup','mixing-arrow')}}/>
                            <div id='custom-mixing-batch-popup'  className='popup-choice-box' onClick={(e)=> {e.preventDefault(); e.stopPropagation(); }}>
                                <div className='custom-select-option'>
                                    <input className='select-search-box' placeholder='Search' value={this.state.searching_mixing_batch} onChange={(e)=> this.setState({ searching_mixing_batch : e.target.value }) }/>
                                </div>
                                {
                                    this.state.mixing_batch_list.map((m) => 
                                        <div key={m.title} className='custom-select-option'
                                                style={{ borderRight : (this.state.mixing_batch_list.length < 6)?'none':'1px solid #ddd',
                                                         display : (this.state.searching_mixing_batch == '' || m.title.includes(this.state.searching_mixing_batch))?'flex':'none'}}
                                                onClick={() => this.customSelectChange( 'mixing_batch',m )}>
                                            <span>{m.title}</span>
                                            <span style={{ display : (m.checked)?'inline-flex':'none'}}>
                                                <img src={CheckIcon}/>
                                            </span>
                                        </div>
                                    )
                                }
                            </div>
                        </div>
                    </label>
                    <label className='second-style'>
                        <input type='checkbox' name='mixingBatch' onClick={(e)=>e.stopPropagation()} onChange={this.handleChange} />
                        <p>First mixing batch</p>
                    </label>
                    <label className='first-style'>
                        <p>Production Personnel</p>
                        <div className='second-style select-container'>
                            <input value={this.state.production_personnel}  name='productionPersonnel' className='input-box select-box' placeholder='Select' 
                                    onClick={(e)=> { e.preventDefault(); e.stopPropagation(); this.openPopUps('custom-pp-popup','pp-arrow')}} readOnly/>
                            <img id='pp-cross' src={CrossIcon} style={{display : (this.state.production_personnel == '')?'none':'flex'}}  onClick={(e)=> { e.preventDefault(); e.stopPropagation(); this.customSelectChange('production_personnel',''); }}/>
                            <img id='pp-arrow' src={ArrowIcon} className='drop-down-arrow-img' onClick={(e)=> { e.preventDefault(); e.stopPropagation(); this.openPopUps('custom-pp-popup','pp-arrow')}}/>
                            <div id='custom-pp-popup'  className='popup-choice-box' >
                                {
                                    this.state.p_personnel_list.map((m) => 
                                        <div key={m} className='custom-select-option'
                                             style={{ borderRight : (this.state.p_personnel_list.length < 6)?'none':'1px solid #ddd'}}
                                             onClick={() => this.customSelectChange( 'production_personnel',m)}>
                                            <span>{m}</span>
                                        </div>
                                    )
                                }
                            </div>
                        </div>
                    </label>
                    <input id='sample-submit-btn' className='submit-btn' type='submit' value='Submit'
                            onClick={(e)=> { e.stopPropagation(); this.handleSubmit(e);}} />
                </form>
            </div>
        )
    }
}