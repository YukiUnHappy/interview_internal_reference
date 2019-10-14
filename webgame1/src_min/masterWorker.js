/**
 Created by JongWon on 2017-12-13.
 */

var _url = "";
var enc_yn = false;

var str_B = "012.123.234.345.456.567.678.789";
var str_A = str_B.split(".");

var cryptTable=new String(" ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789	!@#$%^&*()`'-=[];,./?_+{}|:<>~");
var cryptLength=new Number(cryptTable.length-1)

var lineFeed="\n";
var doubleQuote='"';

function decrypt(input, password)
{
    var inChar, inValue, outValue, escape=false;

    var output="";
    var arNumberPw = new Array();

    var pwLength=password.length;
    var inLength=input.length;

    for (var pwIndex=0; pwIndex<pwLength; pwIndex++)
    {
        arNumberPw[pwIndex]=cryptTable.indexOf(password.charAt(pwIndex));
    }

    for (var inIndex=0, pwIndex=0; inIndex<inLength; inIndex++, pwIndex++)
    {
        if (pwIndex>=pwLength)
        {
            pwIndex=0;
        }

        inChar=input.charAt(inIndex);
        inValue=cryptTable.indexOf(inChar);


        if (inValue==-1)
        {
            outValue=inChar;
        }

        else if (escape)
        {
            if (inValue==cryptLength)
            {
                outValue=lineFeed;
                inValue=-1;
            }
            else if (inChar=="'")
            {
                outValue=doubleQuote;
                inValue=-1;
            }
            else
            {
                inValue+=cryptLength;
            }
            escape=false;
        }
        else if (inValue==cryptLength)
        {
            escape=true;
            pwIndex--;
            outValue="";
            inValue=-1;
        }

        if (inValue!=-1)
        {
            outValue=cryptTable.charAt(arNumberPw[pwIndex] ^ inValue);
        }

        output+=outValue;

    }

    return output;
}



self.onmessage = function (evt) { // evt.data contains the data passed from the calling main page thread.
    switch (evt.data.cmd) {
        case 'init':
            init(evt.data.url,evt.data.encryptYn); // Transfer the initial conditions data to the persistant variables in this thread.
            break;
        case 'crunch':
            getSPJSON();
            break;
        case 'decrypt':
            get_decrypt(evt.data.dataString);
            break;
        case 'loveCgStory':
            load_LoveCgAnimationStory(evt.data.url,evt.data.key);
            break;
        case 'loadBattleScript':
            load_BattleScript(evt.data.url,evt.data.key);
            break;

        default:
            console.error("ERROR FROM worker.js: SWITCH STATEMENT ERROR IN self.onmessage");
    } // switch
};

this.init = function (url,encryptYn) {

    _url = url;
    enc_yn = encryptYn;

};

/**
 * 게임 플레이에 지장을 주는 복호화 속도가 오래 걸리는 데이터들을 사전에 복호화 처리를 함.
 *
 *
 */
this.get_decrypt = function (string) {
    var set = String.fromCharCode(52);
    var de_xor = decrypt(string, str_A[1]+set);
    var data = JSON.parse(de_xor);
    self.postMessage(data);
};

/*
마스터에서 특정 love_cg_story 데이터만 가져온다!!
 */
this.load_LoveCgAnimationStory = function (_url,_key) {

    var test_result = [];

    var xhr = new XMLHttpRequest();
    xhr.open("get", _url, true);
    xhr.send();
    xhr.onreadystatechange = callbackFunction;
    function callbackFunction() {
        // xhr.readyState is
        /*
         0: UNINITIALIZED    객체만 생성되고 아직 초기화되지 않은 생태(OPEN메서드가 호출 되지 않음)
         1: LOADING          OPEN 메서드가 호출되고 아직 SEND 메서드가 불리지 않은 상태
         2: LOADED           SEND메서드가 불렸지만 STATUS와 헤더는 도착하지 않은 상태
         3: INTERACTIVE      데이터의 일부를 받은 상태
         4: COMPLETED        데이터를 전부 받은 상태.
         */
        var status;
        var data;

        if (xhr.readyState == 4)   // DONE
        {
            status = xhr.status;
            if (status == 200) {

                    try{

                        var set = String.fromCharCode(52);
                        var de_xor = decrypt( xhr.responseText, str_A[1]+set);
                        data = JSON.parse(de_xor);

                        data.forEach(function (log_cg) {

                            if(log_cg.love_cg_story_num == _key){
                                test_result.push(log_cg);
                            }

                        });

                        self.postMessage(test_result);

                        data = null;
						test_result = null;
                        delete xhr;

                    }catch (e){

                        self.postMessage([]);

                    }


            }else{
                self.postMessage([]);
            }
        }
    }
};

this.load_BattleScript = function (_url,_key) {

    var test_result = [];

    var xhr = new XMLHttpRequest();
    xhr.open("get", _url, true);
    xhr.send();
    xhr.onreadystatechange = callbackFunction;
    function callbackFunction() {
        // xhr.readyState is
        /*
         0: UNINITIALIZED    객체만 생성되고 아직 초기화되지 않은 생태(OPEN메서드가 호출 되지 않음)
         1: LOADING          OPEN 메서드가 호출되고 아직 SEND 메서드가 불리지 않은 상태
         2: LOADED           SEND메서드가 불렸지만 STATUS와 헤더는 도착하지 않은 상태
         3: INTERACTIVE      데이터의 일부를 받은 상태
         4: COMPLETED        데이터를 전부 받은 상태.
         */
        var status;
        var data;

        if (xhr.readyState == 4)   // DONE
        {
            status = xhr.status;
            if (status == 200) {

                try{

                    var set = String.fromCharCode(52);
                    var de_xor = decrypt( xhr.responseText, str_A[1]+set);
                    data = JSON.parse(de_xor);

                    if(_key.type != "event_dungeon"){

                        data.forEach(function (log_cg) {

                            if(log_cg.main_mission_id == _key.script_id){
                                test_result.push(log_cg);
                            }

                        });

                    }else{

                        data.forEach(function (log_cg) {

                            if(log_cg.event_dungeon_idx == _key.script_id){
                                test_result.push(log_cg);
                            }

                        });

                    }

                    self.postMessage(test_result);

                    data = null;
                    delete xhr;

                }catch (e){

                    self.postMessage([]);

                }


            }else{
                self.postMessage([]);
            }
        }
    }

}

this.getSPJSON = function() {
    var xhr = new XMLHttpRequest();
    xhr.open("get", _url, true);
    xhr.send();
    xhr.onreadystatechange = callbackFunction;
    function callbackFunction() {
        // xhr.readyState is
        /*
         0: UNINITIALIZED    객체만 생성되고 아직 초기화되지 않은 생태(OPEN메서드가 호출 되지 않음)
         1: LOADING          OPEN 메서드가 호출되고 아직 SEND 메서드가 불리지 않은 상태
         2: LOADED           SEND메서드가 불렸지만 STATUS와 헤더는 도착하지 않은 상태
         3: INTERACTIVE      데이터의 일부를 받은 상태
         4: COMPLETED        데이터를 전부 받은 상태.
         */
        var status;
        var data;

        if (xhr.readyState == 4)   // DONE
        {

            status = xhr.status;
            if (status == 200) {

                if(enc_yn == false){

                    data = JSON.parse(xhr.responseText);
                    self.postMessage(data);

                }else{

                    try{
                        var set = String.fromCharCode(52);
                        var de_xor = decrypt( xhr.responseText, str_A[1]+set);
                        data = JSON.parse(de_xor);
                        self.postMessage(data);

                        data = null;
                        delete xhr;

                    }catch (e){

                        self.postMessage([]);

                    }



                }


            }else{
                self.postMessage([]);
            }
        }
    }
};