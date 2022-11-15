import { Component } from "react";
import BadgeIcon from '../../assets/workspace_premium.svg';
import './mixBatchTable.scss';
import { inspection_dummy_data, samplesData } from "./inspectdata";
import { getFormatedDate } from "../../helper/util.service";

export class MixBatchTable extends Component{

    constructor(props){
        super(props);
        this.state = {
            result : {},
            colorTest : [],
            analyticalTest : [],
            mechanicalTest : [],
            userLoggedIn : this.props.userLoggedIn || false,
        }
    }

    samples = [];
    inspection_data = [];
    average_samples_list = [];

    async componentDidMount(){
        await this.apiCall()
        this.setTableConfiguration();
    }

    componentDidUpdate(prevProps){
        if(prevProps.userLoggedIn != this.props.userLoggedIn){
            this.setState({ userLoggedIn : this.props.userLoggedIn });
        }
    }

    apiCall = async() => {

        // api call for getting inspection plans
        this.inspection_data = inspection_dummy_data;
        // api cal for getting sample plans
        this.samples = samplesData;
        
    }

    setTableConfiguration = () => {

        let result = {};
        let colorTest = this.inspection_data.filter( f => f.test_type == 'color' );
        let analyticalTest = this.inspection_data.filter( f => f.test_type == 'analytical');
        let mechanicalTest = this.inspection_data.filter( f => f.test_type == 'mechanical');
        colorTest.forEach( c => result[c.inspection_characeristic] = '' );
        analyticalTest.forEach( c => result[c.inspection_characeristic] = '' );
        mechanicalTest.forEach( c => result[c.inspection_characeristic] = '' );

        this.setState({ result, colorTest, analyticalTest, mechanicalTest });
        
        let fixedRowCount = 2;
        let totalRows = fixedRowCount + this.inspection_data.length;
        let visibleRowCount = (totalRows >= 11)? 11 : totalRows;
        let tableHeight = (55 * totalRows) + 120;
        let tableContainerHeight = (55 * visibleRowCount) + 135;

        document.getElementById('mixbatch-table').style.height = tableContainerHeight+"px";
        document.getElementById('inspection-static').style.height = tableHeight+"px";
        document.getElementById('inspection-static1').style.height = tableHeight+"px";
        document.getElementById('inspection-static2').style.height = tableHeight+"px";
        document.getElementById('inspection-static3').style.height = tableHeight+"px";
        document.getElementById('inspection-static4').style.height = tableHeight+"px";
        document.getElementById('batch-average').style.height = tableHeight+"px";

        let batchWidth = (this.samples.length < 5)? (50/this.samples.length) : (10);
        for (let i = 0; i<this.samples.length; i++) {
            document.getElementById('batch'+this.samples[i].sample_number).style.height = tableHeight+"px";
            document.getElementById('batch'+this.samples[i].sample_number).style.width = batchWidth+'%';
        }
    }

    displayStyle = (type, data) => {
        if(type == "instructions"){
            if(!data.redo && !data.resubmit) return "-";
            if(data.redo && !data.resubmit) return "Redo";
            if(!data.redo && data.resubmit) return "Resubmit";
            if(data.redo && data.resubmit) return "Redo, Resubmit";
        }

        if(type == "shot_number"){
            if(data.sampleType == 'retint') return ", R-"+data.shotno;
            if(data.sampleType == 'colour-blend') return ", B-"+data.shotno;
            if(data.sampleType == 'scale-up') return ", S-"+data.shotno;
            return "";
        }

        return "-";
    }

    checkForApproval = (value, test_data) => {
        if(value == '' || value == undefined || value == '-')
            return null;   //nothing
        
        else if(test_data.is_qualitative){
                if(value.toString().toLowerCase() == 'confirm') return true;   //pass
            }
        else if( !test_data.is_qualitative && parseFloat(test_data.lower_limit) <= parseFloat(value) && parseFloat(test_data.upper_limit) >= parseFloat(value) ){
                return true    //pass
            }
        
        return false; //fail
    }

    colorBackgroundForData = (value, test_data) => {
        let result = this.checkForApproval(value, test_data);
        if (result == null) return { background : 'transparent' };  //empty
        if (result == true) return { background : '#CBE3B6' }       //pass
        if (result == false) return { background : '#EAD5D5' };      //fail
    }

    getPropertyName = (test_data) => {

        // which property of samples you want to show  along side inspection test

        switch(test_data.inspection_characeristic){
            case 'Visual Color Assessment - General' : return 'data2';
            case 'Moisture Content (Method B)' : return 'data3';
            case 'Reinforced Filler Content(Glass/Mineral)' : return 'data4';
            case 'Viscosity Number (Method B)' : return 'data5';
            case 'Charpy Impact Strength (23° Unnotched)' : return 'data6';
            default : return 'random';
        }
    }

    helpingQuantityAverageCalculation = (test_data) => {

        let total_batches = 0;
        let total_sum = 0;
        this.average_samples_list.forEach( a => {
            let value = a[this.getPropertyName(test_data)];
            if(value != '' && value != undefined && value != '-'){
                total_batches = total_batches + 1;
                total_sum = total_sum + parseFloat(value);
            }
        });

        if(total_batches > 0 ) 
            return (total_sum/total_batches).toFixed(2);

        return  '';
    }

    helpingQualityAverageCalculation = (test_data) => {

        let countConfirm = 0;
        let countNotConfirm = 0;

        this.average_samples_list.forEach( a => {
            let value = a[this.getPropertyName(test_data)];
            if(value != '' && value != undefined && value != '-'){
                if(value.toString().toLowerCase() != 'confirm'){
                    countNotConfirm = countNotConfirm + 1;
                    return 'Does Not Confirm';
                }
                else{
                    countConfirm = countConfirm + 1;
                }
            }
        });

        if(countNotConfirm > 0)
            return 'Does Not Confirm';
        if(countConfirm > 0) 
            return 'Confirm';

        return '';
    }

    checkBoxAction =  (data,e) => {
        
        if(e.target.checked == true){ 
            document.getElementById('batch'+data.sample_number).style.opacity = 0.7;
            this.average_samples_list.push(data);
        }
        else{ 
            document.getElementById('batch'+data.sample_number).style.opacity = 1;
            this.average_samples_list = this.average_samples_list.filter(f => f.sample_number != data.sample_number);
        }
        
        let average_data = {}; 

        // calculating average for all test
        [this.state.colorTest, this.state.analyticalTest, this.state.mechanicalTest].forEach(test_arr => {

            test_arr.forEach( c => {
                if(c.is_qualitative) 
                    average_data[c.inspection_characeristic] = this.helpingQualityAverageCalculation(c);
                else 
                    average_data[c.inspection_characeristic] = this.helpingQuantityAverageCalculation(c);
            });

        })


        this.setState({ result : average_data });
        
        // this variable will tell parent Component if all average are success or failure
        let allApproved = true;

        //sending signal to parent component that average is success or failure for all tests
        [this.state.colorTest, this.state.analyticalTest, this.state.mechanicalTest].forEach(test_arr => {

            test_arr.forEach( f => {
                let response = this.checkForApproval(average_data[f.inspection_characeristic], f);
                if(response == false || null){ 
                    allApproved = false;
                    return;
                }
            });

            if(allApproved == false) return;
        })

        if(this.average_samples_list.length == 0 ) allApproved = false;

        this.props.passStatusToParent(allApproved);
        
    }

    render(){
        return(
            <div id='mixbatchtable-page'>
                    <span className="empty-plan-banner" 
                          style={{ fontWeight : '600', fontSize : '20px',
                          display : ( this.state.colorTest.length == 0 && 
                                      this.state.analyticalTest.length == 0 &&
                                      this.state.mechanicalTest.length == 0 ) ? 'flex':'none' }}>
                        INSPECTION PLAN UNAVAILABLE
                    </span>
                    <div id='mixbatch-table'>
                        <div id="inspection-static">
                            <div className='header-col'>
                                <div>COA</div>                                
                                <div></div>
                            </div>
                            {(this.state.colorTest || []).map( (c,i) => <div key={"inspectC"+i} className="data-col">{(c.is_coa)?<img src={BadgeIcon} />:""}</div>)}
                            <div className="data-col empty-row"></div>
                            {(this.state.analyticalTest || []).map( (c,i) => <div key={"inspectA"+i} className="data-col">{(c.is_coa)?<img src={BadgeIcon} />:""}</div>)}
                            <div className="data-col empty-row"></div>
                            {(this.state.mechanicalTest || []).map( (c,i) => <div key={"inspectM"+i} className="data-col">{(c.is_coa)?<img src={BadgeIcon} />:""}</div>)}
                        </div>
                        <div id="inspection-static1">
                            <div className='header-col'>
                                <div>INSP.CHAR</div>                                
                                <div><span className="empty-row"  style={{fontWeight : '600'}}>COLOR TEST</span></div>
                            </div>
                            {(this.state.colorTest || []).map( (c,i) => <div key={"inspect1C"+i} className="data-col"><p>{c.inspection_characeristic}</p></div>)}
                            <div className="data-col empty-row">ANALYTICAL TEST</div>
                            {(this.state.analyticalTest || []).map( (c,i) => <div key={"inspect1A"+i} className="data-col"><p>{c.inspection_characeristic}</p></div>)}
                            <div className="data-col empty-row">MECHANICAL TEST</div>
                            {(this.state.mechanicalTest || []).map( (c,i) => <div key={"inspect1M"+i} className="data-col"><p>{c.inspection_characeristic}</p></div>)}
                        </div>
                        <div id="inspection-static2">
                            <div className='header-col'>
                                <div>UNIT</div>                                
                                <div></div>
                            </div>
                            {(this.state.colorTest || []).map( (c,i) => <div key={"inspect2C"+i} className="data-col"><p>{c.uom}</p></div>)}
                            <div className="data-col empty-row"></div>
                            {(this.state.analyticalTest || []).map( (c,i) => <div key={"inspect2A"+i} className="data-col"><p>{c.uom}</p></div>)}
                            <div className="data-col empty-row"></div>
                            {(this.state.mechanicalTest || []).map( (c,i) => <div key={"inspect2M"+i} className="data-col"><p>{c.uom}</p></div>)}
                        </div>
                        <div id="inspection-static3">
                            <div className='header-col'>
                                <div>LOW.LIMIT</div>                                
                                <div></div>
                            </div>
                            {(this.state.colorTest || []).map( (c,i) => <div key={"inspect3C"+i} className="data-col"><p>{c.lower_limit}</p></div>)}
                            <div className="data-col empty-row"><p></p></div>
                            {(this.state.analyticalTest || []).map( (c,i) => <div key={"inspect3A"+i} className="data-col"><p>{c.lower_limit}</p></div>)}
                            <div className="data-col empty-row"></div>
                            {(this.state.mechanicalTest || []).map( (c,i) => <div key={"inspect3M"+i} className="data-col"><p>{c.lower_limit}</p></div>)}
                        </div>
                        <div id="inspection-static4">
                            <div className='header-col'>
                                <div>UP.LIMIT</div>                                
                                <div></div>
                            </div>
                            {(this.state.colorTest || []).map( (c,i) => <div key={"inspect4C"+i} className="data-col"><p>{c.upper_limit}</p></div>)}
                            <div className="data-col empty-row"><p></p></div>
                            {(this.state.analyticalTest || []).map( (c,i) => <div key={"inspect4A"+i} className="data-col"><p>{c.upper_limit}</p></div>)}
                            <div className="data-col empty-row"></div>
                            {(this.state.mechanicalTest || []).map( (c,i) => <div key={"inspect4M"+i} className="data-col"><p>{c.upper_limit}</p></div>)}
                        </div>
                        {
                            this.samples.map( (d,i )=> 
                                <div key={i} id={"batch"+d.sample_number} className='batch-columns'>
                                    <div className='header-col'>
                                        <div><input type='checkbox' disabled={ !this.state.userLoggedIn } onClick={(e)=>this.checkBoxAction(d,e)} /></div>
                                        <div>{d.tab_title || "-"}</div>
                                        <div>
                                            {(d.sampleType != "")?<b>{ d.sampleType.charAt(0).toUpperCase() + d.sampleType.substring(1) }</b>:"-"}
                                            {this.displayStyle('shot_number',d)}
                                        </div>
                                        <div>{this.displayStyle("instructions",d)}</div>
                                        <div>{getFormatedDate(d.checked_out_at) || "-"}</div>
                                    </div>
                                    {(
                                        this.state.colorTest || []).map( (c,i) => 
                                        <div key={"batchC"+i+d.sample_number} className="data-col">
                                            <p style={this.colorBackgroundForData(d[this.getPropertyName(c)],c)}>{d[this.getPropertyName(c)] || "-"}</p>
                                        </div>
                                    )}
                                    <div className="data-col"></div>
                                    {(
                                        this.state.analyticalTest || []).map( (c,i) => 
                                        <div key={"batchA"+i+d.sample_number} className="data-col">
                                            <p style={this.colorBackgroundForData(d[this.getPropertyName(c)],c)}>{d[this.getPropertyName(c)] || "-"}</p>
                                        </div>
                                    )}
                                    <div className="data-col"></div>
                                    {(
                                        this.state.mechanicalTest || []).map( (c,i) => 
                                        <div key={"batchM"+i+d.sample_number} className="data-col">
                                            <p style={this.colorBackgroundForData(d[this.getPropertyName(c)],c)}>{d[this.getPropertyName(c)] || "-"}</p>
                                        </div>
                                    )}
                                </div>
                            )
                        }
                        <div id='batch-average'>
                            <div className='header-col'>
                                <div>AVERAGE</div>                                
                                <div></div>
                            </div>
                            {(this.state.colorTest || []).map( (c,i) => 
                                <div key={"avgC"+i} className="data-col">
                                    <p style={this.colorBackgroundForData(this.state.result[c.inspection_characeristic],c)}>{this.state.result[c.inspection_characeristic] || "-"}</p>
                                </div>
                            )}
                            <div className="data-col"></div>
                            {(this.state.analyticalTest || []).map( (c,i) => 
                                <div key={"avgA"+i} className="data-col">
                                    <p style={this.colorBackgroundForData(this.state.result[c.inspection_characeristic],c)}>{this.state.result[c.inspection_characeristic] || "-"}</p>
                                </div>
                            )}
                            <div className="data-col"></div>
                            {(this.state.mechanicalTest || []).map( (c,i) => 
                                <div key={"avgM"+i} className="data-col">
                                    <p style={this.colorBackgroundForData(this.state.result[c.inspection_characeristic],c)}>{this.state.result[c.inspection_characeristic] || "-"}</p>
                                </div>
                            )}
                        </div>
                    </div>
            </div>
        )
    }
}