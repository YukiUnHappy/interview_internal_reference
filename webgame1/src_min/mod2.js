//data.min.js
eval('var test = ' + MasterManager.getInstance().load_Master_table.toString().replace('worker=null', 'worker.terminate(),worker=null'))
MasterManager.getInstance().load_Master_table = test
eval('var test = ' + MasterManager.getInstance().pre_decrypt_master.toString().replace('worker=null', 'worker.terminate(),worker=null'))
MasterManager.getInstance().pre_decrypt_master = test

//frame1.min.js
GeneralService.getInstance().getUserBookGeneral = function(a) { a.is_gain = a.is_max_love_level = a.is_max_level = !0 }

LoveContentsScriptLayer_V2.prototype.mosaic = function() { this.hideMosaic() }

const d = LoveContentsScriptLayer_V2.prototype.decrypt_love
LoveContentsScriptLayer_V2.prototype.decrypt_love = (a, b) => a.startsWith('{') ? a : d(a, b)

const o1 = LoveContentsCGScene.prototype.initLayout
LoveContentsCGScene.prototype.initLayout = function() {
  let m_worker
  Object.defineProperty(this, 'm_worker', {
    get: () => m_worker,
    set: function(v) {
      if (v === null && m_worker) m_worker.terminate()
      m_worker = v
    }
  })
  o1.apply(this, arguments)
}

const o2 = NetService
NetService = function() { const o = o2(); o.getUserIllust = () => true; return o }

fetch('https://dd9p08ibbq1ax.cloudfront.net/hscene/mod.json').then(e => e.json()).then(j => LoveCgGeneralName = {...LoveCgGeneralName, ...j})