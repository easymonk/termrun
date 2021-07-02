module.exports = {
  '_getImages-des': `获取镜像name`,
  _getImages: () => {
    return 'vue2.8' // test_20191107 //new_20191122 //new_vue_20200227_patch_3
  },
  _getPublic: function (srcPath) {
    let path = require('path')
    let fs = require('fs-extra')
    let publicPath = path.join(srcPath, '../public')
    let isExist = fs.existsSync(publicPath)
    return isExist ? publicPath : ''
  },
  '_getSvnConf-des': '获取svn配置',
  _getSvnConf: function () {
    // 获取svnConf地址
    let os = require('os')
    let path = require('path')
    let fs = require('fs-extra')
    let svnConf = path.join(os.homedir(), './svnConf')
    let svnConfFile = path.join(svnConf, './svnConf.js')
    fs.ensureFileSync(svnConfFile)
    let svnConfCheck = {}
    let isOk = true

    try {
      svnConfCheck = require(svnConfFile)
      if (
        svnConfCheck &&
        svnConfCheck.svnUserName &&
        svnConfCheck.svnPassword
      ) {
        isOk = true
      } else {
        isOk = false
        fs.writeFileSync(
          svnConfFile,
          `module.exports = ${ JSON.stringify(
            {
              svnUserName: '',
              svnPassword: ''
            },
            '',
            ' '
          ) }`
        )
        this.log.red(
          `请修改文件${ svnConfFile }内的svn配置信息，确保svn正常使用`
        )
      }
    } catch (e) {
      isOk = false
      this.log.red(`请修改文件${ svnConfFile }内的svn配置信息，确保svn正常使用`)
    }
    if (isOk) {
      return svnConf
    } else {
      process.exit(0)
    }
  },
  "jms-release-des": "jms 上线",
  "jmsRelease": function () {
    let conf = this._getConfig()
    if (conf.jmsName && conf.jmsPwd && conf.jmsReleasePath) {
      let str = `expect ${ conf.jmsReleasePath } ${ conf.jmsName } ${ conf.jmsPwd }`
      this.run(str, function () {
        console.log('执行成功')
      })
    } else {
      console.log('请在用户目录下的svnConf文件夹内localConf文件补充 jmsReleasePath  jmsName jmsPwd')
    }
  },
  'buildDocker-des':
    '构建docker镜像，需要进入dockerFile目录执行 termrun buildDokcer new_docker',
  buildDocker: function (name) {
    if (!name) {
      this.log.red(
        '请传入新的docker镜像名字,例如 【 termrun buildDokcer new_docker 】'
      )
      return;
    }
    let str = `docker build -t ${ name } .`
    this.run(str, function () {
      console.log('执行成功')
    })
  },

  _getCmsName: nowDir => {
    let path = require('path')
    let pConf = {}
    let fs = require('fs-extra')
    if (fs.existsSync(nowDir + '/porjectConf.js')) {
      // 修正
      fs.renameSync(nowDir + '/porjectConf.js', nowDir + '/projectConf.js')
    }
    try {
      pConf = require(nowDir + '/projectConf.js')
    } catch (e) { }
    return pConf.name || pConf.appName || path.basename(nowDir)
  },
  _getActName: nowDir => {
    let path = require('path')
    let pConf = {}
    try {
      pConf = require(nowDir + '/project.json')
    } catch (e) { }
    return pConf.name || path.basename(nowDir)
  },
  'getLibPath-des': `本地lib地址,先获取本地配置中的lib地址，没有会获取此设置的地址`,
  getLibPath: function (nowDir, mis = false) {
    let pConf = {}
    try {
      pConf = require(nowDir + (mis ? '/projectConf.js' : '/project.json'))
    } catch (e) { }
    if (!pConf.lib) {
      pConf.lib = this._getConfig().lib
    }
    return pConf.lib || ''
  },
  _getConfig: function () {
    // 从用户目录中获取
    let pConf = {}
    let os = require('os')
    let path = require('path')
    let fs = require('fs-extra')
    let localConf = path.join(os.homedir(), './svnConf')
    let localConfFile = path.join(localConf, './localConf.js')
    fs.ensureFileSync(localConfFile)
    try {
      localConfCheck = require(localConfFile)
      if (
        typeof localConfCheck === 'object' && localConfCheck.for
      ) {
        isOk = true
        pConf = localConfCheck
        pConf.lib = localConfCheck.libPath
      } else {
        isOk = false
        fs.writeFileSync(
          localConfFile,
          `module.exports = ${ JSON.stringify(
            {
              'libPath': '',
              'for': 'dockerVue',
              jmsReleasePath: '',
              jmsName: '',
              jmsPwd: ''
            },
            '',
            ' '
          ) }`
        )
        console.log(
          `请修改文件${ localConfFile }内的libPath配置信息，确保libPath正常使用`
        )
      }
    } catch (e) {
      isOk = false
      console.log(`请修改文件${ localConfFile }内的配置信息`)
    }
    return pConf || {}
  },
  'cmsDev-des': `cms项目开发命令，'接收参数'[端口]`,
  cmsDev: async function (port) {
    var nowDir = process.cwd()
    let workdir = '/workdir/vue'
    let name = this._getCmsName(nowDir)
    let publicPath = this._getPublic(nowDir)
    let libpath = this.getLibPath(nowDir, true)
    port = await this._portIsOccupied(port || 1800)
    let images = this._getImages()
    var docker = `docker run --rm -i ${ publicPath ? `-v ${ publicPath }:${ workdir }/public` : '' }  -v ${ nowDir }:${ workdir }/myapp/src  -v ${ libpath }:${ workdir }/lib  -p ${ port }:${ port }/tcp  --name ${ name }-d-${ port } -e PORT=${ port } ${ images } yarn start`
    this.run(docker, function () {
      console.log('执行成功')
      console.log(docker)
    })
    this._openBrowser(port)
  },
  'cmsBuild-des': `cms项目构建命令`,
  cmsBuild: function () {
    let fs = require('fs-extra')
    let path = require('path')
    var basePath = process.cwd()
    let workdir = '/workdir/vue'
    let name = this._getCmsName(basePath)
    let libpath = this.getLibPath(basePath, true)
    let publicPath = this._getPublic(basePath)
    let parentPath = path.join(path.dirname(basePath), `${ name }-dist`) //
    if (!fs.pathExistsSync(parentPath)) {
      fs.mkdirSync(parentPath)
    }
    let images = this._getImages()
    var docker = `docker run --rm ${ publicPath ? `-v ${ publicPath }:${ workdir }/public` : '' } -v ${ basePath }:${ workdir }/myapp/src -v ${ parentPath }:${ workdir }/myapp/dist -v ${ libpath }:${ workdir }/lib  --name ${ name }-b ${ images } yarn build`
    this.run(docker, function () {
      console.log('执行成功')
    })
  },
  'cmsRelease-des': `cms项目上线命令，需要带入 上线日志，例如：termrun cmsRelease [comment]`,
  cmsRelease: function (...releaseMsg) {
    msg = releaseMsg.join('，') || ''
    if (!msg) {
      this.log.red(
        'cms上线需要上线日志才可以执行，例如 termrun cmsRelease update'
      )
      return;
    }
    let path = require('path')
    var basePath = process.cwd()
    let workdir = '/workdir/vue'
    let name = this._getCmsName(basePath)
    let parentPath = path.join(path.dirname(basePath), `${ name }-dist`)
    let images = this._getImages()
    let svnConf = this._getSvnConf()
    let _this = this
    // -v ${parentPath}:${workdir}/dist
    var docker = `docker run -i -v ${ basePath }:${ workdir }/myapp/src  -v ${ parentPath }:${ workdir }/myapp/dist  -v ${ svnConf }:${ workdir }/svnConfig  --rm  --name ${ name }-r ${ images } yarn r -releaseType=2 -releaseMsg=${ msg }`
    this.run(docker, function () {
      console.log('执行成功')
      _this.jmsRelease()
      _this._releaseAfter(basePath + '/projectConf.js', 2, msg)
    })
  },
  'cmsCreate-des': `cms项目创建项目;需要在src目录下`,
  cmsCreate: function () {
    var basePath = process.cwd()
    let workdir = '/workdir/vue'
    let name = this._getCmsName(basePath)
    let images = this._getImages()
    var docker = `docker run -v ${ basePath }:${ workdir }/myapp/src  --rm  --name ${ name }-c ${ images } yarn c 2`
    this.run(docker, function () {
      console.log('执行成功，请修改projectConf.js内容')
      console.log(docker)
    })
  },
  cmsLintFix: function () {
    var basePath = process.cwd()
    let workdir = '/workdir/vue'
    let name = this._getCmsName(basePath)
    let images = this._getImages()
    var docker = `docker run -v ${ basePath }:${ workdir }/myapp/src  --rm  --name ${ name }-c ${ images } yarn lint --fix`
    this.run(docker, function () {
      console.log('执行成功，请修改projectConf.js内容')
      console.log(docker)
    })
  },
  'stop-des': `docker 停止命令 ，需要带入docker的名字`,
  stop: function (name) {
    if (name) {
      this.run('docker stop ' + name, function () {
        console.log('执行成功')
      })
    } else {
      console.log(this['stop-des'])
    }
  },

  'actCreate-des': `H5项目创建命令，需要在项目所在文件加内执行`,
  actCreate: function () {
    // let path = require('path')
    var basePath = process.cwd()
    // let parentPath = path.dirname(basePath)
    let workdir = '/workdir/vue'
    let name = this._getActName(basePath)
    let images = this._getImages()
    var docker = `docker run -v ${ basePath }:${ workdir }/myapp  --rm  --name ${ name }-c ${ images } yarn c  1`
    this.run(docker, function () {
      console.log('执行成功')
    })
  },
  'actDev-des': `H5项目开发商命令，可带入[端口]`,
  actDev: async function (port) {
    let path = require('path')
    var basePath = process.cwd()
    // let parentPath = path.dirname(basePath)
    let workdir = '/workdir/vue'
    let name = this._getActName(basePath)
    let images = this._getImages()
    let libpath = this.getLibPath(basePath)
    let publicPath = this._getPublic(basePath + '/src')
    port = await this._portIsOccupied(port || 1800) || 1900
    var docker = `docker run -i -v  ${ basePath }:${ workdir }/myapp -v ${ libpath }:${ workdir }/lib  ${ publicPath ? `-v ${ publicPath }:${ workdir }/public` : '' }  --rm  -p ${ port }:${ port }/tcp --name ${ name }-d-${ port } -e PORT=${ port } ${ images }  yarn start  `
    console.log(docker)
    this.run(docker, function () {
      console.log('执行成功')
      console.log(docker)
    })
    this._openBrowser(port)
  },
  'actAnalyz-des': `H5项目分析命令，可带入参数[port]`,
  actAnalyz: function (port) {
    let path = require('path')
    var basePath = process.cwd()
    // let parentPath = path.dirname(basePath)
    let workdir = '/workdir/vue'
    let name = this._getActName(basePath)
    let images = this._getImages()
    port = port || 8888
    let libpath = this.getLibPath(basePath)
    var docker = `docker run -v ${ basePath }:${ workdir }/myapp -v ${ libpath }:${ workdir }/lib -i --rm  -p ${ port }:${ port }/tcp -e PORT=${ port }  --name ${ name }-b  ${ images } yarn build:analyz`
    console.log(docker)
    this.run(docker, function () {
      console.log('执行成功')
    })
  },
  'actBM-des': `H5项目构建命令，正在测试修正中....`,
  actBMH: function () {
    let path = require('path')
    var basePath = process.cwd()
    // let parentPath = path.dirname(basePath)
    let workdir = '/workdir/vue'
    let name = this._getActName(basePath)
    let images = this._getImages()
    let libpath = this.getLibPath(basePath)
    let buildWay = 'build:modern:hdc'
    var docker = `docker run -v ${ basePath }:${ workdir }/myapp -v ${ libpath }:${ workdir }/lib -i --rm  --name ${ name }-b  ${ images } yarn ${ buildWay } `
    this.run(docker, function () {
      console.log('执行成功')
    })
  },
  'actBM-des': `H5项目构建命令，正在测试修正中....`,
  actBM: function () {
    let path = require('path')
    var basePath = process.cwd()
    // let parentPath = path.dirname(basePath)
    let workdir = '/workdir/vue'
    let name = this._getActName(basePath)
    let images = this._getImages()
    let libpath = this.getLibPath(basePath)
    let buildWay = 'build:modern'
    var docker = `docker run -v ${ basePath }:${ workdir }/myapp -v ${ libpath }:${ workdir }/lib -i --rm  --name ${ name }-b  ${ images } yarn ${ buildWay } `
    this.run(docker, function () {
      console.log('执行成功')
    })
  },
  'actBM-des': `H5项目构建命令，正在测试修正中....`,
  actBMC: function () {
    let path = require('path')
    var basePath = process.cwd()
    // let parentPath = path.dirname(basePath)
    let workdir = '/workdir/vue'
    let name = this._getActName(basePath)
    let images = this._getImages()
    let libpath = this.getLibPath(basePath)
    let buildWay = 'build:modern:cache'
    var docker = `docker run -v ${ basePath }:${ workdir }/myapp -v ${ libpath }:${ workdir }/lib -i --rm  --name ${ name }-b  ${ images } yarn ${ buildWay } `
    this.run(docker, function () {
      console.log('执行成功')
    })
  },
  'actBMCH-des': `H5项目构建命令，正在测试修正中....`,
  actBMCH: function () {
    let path = require('path')
    var basePath = process.cwd()
    // let parentPath = path.dirname(basePath)
    let workdir = '/workdir/vue'
    let name = this._getActName(basePath)
    let images = this._getImages()
    let libpath = this.getLibPath(basePath)
    let buildWay = 'build:modern:cache:hdc'
    var docker = `docker run -v ${ basePath }:${ workdir }/myapp -v ${ libpath }:${ workdir }/lib -i --rm  --name ${ name }-b  ${ images } yarn ${ buildWay } `
    this.run(docker, function () {
      console.log('执行成功')
    })
  },
  'actBuild-des': `H5项目构建命令，可带入参数[isHDC]`,
  actBuild: function (isHDC) {
    let path = require('path')
    var basePath = process.cwd()
    // let parentPath = path.dirname(basePath)
    let workdir = '/workdir/vue'
    let name = this._getActName(basePath)
    let images = this._getImages()
    let libpath = this.getLibPath(basePath)
    let publicPath = this._getPublic(basePath + '/src')
    let buildWay = 'build'
    var docker = `docker run -v ${ basePath }:${ workdir }/myapp -v ${ libpath }:${ workdir }/lib ${ publicPath ? `-v ${ publicPath }:${ workdir }/public` : '' } -i --rm  --name ${ name }-b  ${ images } yarn ${ buildWay } `
    this.run(docker, () => {
      console.log('执行成功')
      if (buildWay === 'build') {
        // this._buildAfter()
      }
    })
  },
  cmd: function (...arr) {
    let path = require('path')
    var basePath = process.cwd()
    // let parentPath = path.dirname(basePath)
    let pConf = {}
    try {
      pConf = require(basePath + '/project.json')
    } catch (e) {
      try {
        let fs = require('fs-extra')
        if (fs.existsSync(nowDir + '/porjectConf.js')) {
          // 修正
          fs.renameSync(nowDir + '/porjectConf.js', nowDir + '/projectConf.js')
        }
        pConf = require(basePath + '/projectConf.js')
      } catch (e) { }
    }
    let workdir = '/workdir/vue'
    let name = this._getActName(basePath)
    let images = this._getImages()
    let publicPath = this._getPublic(basePath + '/src')
    let libpath = this.getLibPath(basePath)
    var docker = `docker run -v ${ basePath }:${ workdir }${ pConf.type === 'act' ? '/myapp' : '/myapp/src' } -v ${ libpath }:${ workdir }/lib ${ publicPath ? `-v ${ publicPath }:${ workdir }/public` : '' } -i --rm  --name ${ name }-b  ${ images } ${ arr.join(' ') } `
    this.run(docker, function () {
      console.log(docker)
      console.log('执行成功')
    })
  },
  'actBuildPwa-des': `H5项目构建命令，可带入参数[isHDC]`,
  actBuildPwa: function () {
    let path = require('path')
    var basePath = process.cwd()
    // let parentPath = path.dirname(basePath)
    let workdir = '/workdir/vue'
    let name = this._getActName(basePath)
    let images = this._getImages()
    let libpath = this.getLibPath(basePath)
    let buildWay = 'build:pwa'
    var docker = `docker run -v ${ basePath }:${ workdir }/myapp -v ${ libpath }:${ workdir }/lib -i --rm  --name ${ name }-b  ${ images } yarn ${ buildWay } `
    this.run(docker, function () {
      console.log('执行成功')
    })
  },
  'actBfta-des': `H5项目构建命令，默认使用HDC`,
  actBfta: function (param) {
    return this.actBuild(true, true)
  },
  '_getImages_old': () => {
    return 'new_20191122'// test_20191107 //new_20191122
  },
  'actBftaOld-des': `H5项目构建命令，默认使用HDC-old`,
  'actBftaOld': function () {
    let path = require('path')
    var basePath = process.cwd()
    let parentPath = path.dirname(basePath)
    let workdir = '/workdir/vue_act'
    let name = this._getActName(basePath)
    let images = this._getImages_old()
    let libpath = this.getLibPath(basePath)
    let buildWay = 'bfta'
    var docker = `docker run -v ${ parentPath }:${ workdir }/myapp -v ${ libpath }:${ workdir }/lib -i --rm -w ${ workdir }  --name ${ name }-b  ${ images } yarn ${ buildWay } ${ name }`
    this.run(docker, function () {
      console.log('执行成功')
    })
  },
  actLintFix: function () {
    var basePath = process.cwd()
    let workdir = '/workdir/vue'
    let name = this._getCmsName(basePath)
    let images = this._getImages()
    var docker = `docker run -v ${ basePath }:${ workdir }/myapp  --rm  --name ${ name }-c ${ images } yarn lint --fix`
    this.run(docker, function () {
      console.log('执行成功，请修改projectConf.js内容')
      console.log(docker)
    })
  },
  'actRelease-des': `H5项目上线命令，带入参数 ：上线类型（1:测试；2:线上）,上线日志`,
  actRelease: function (releaseType, ...releaseMsg) {
    releaseMsg = releaseMsg.join('，')
    if (!releaseType) {
      this.log.red(
        '需要输入上线类型，1是测试，2是线上',
        'termrun actRelease [releaseType] [releaseMsg]'
      )
      return;
    }
    if (!releaseMsg) {
      this.log.red(
        '需要输入上线日志',
        'termrun actRelease [releaseType] [releaseMsg]'
      )
      return;
    }
    // let path = require('path')
    var basePath = process.cwd()
    // let parentPath = path.dirname(basePath)
    let workdir = '/workdir/vue'
    let name = this._getActName(basePath)
    let images = this._getImages()
    // let libpath = this.getLibPath(basePath)
    let svnConf = this._getSvnConf()
    // docker run -i -v $(basePath):$(workdir)/myapp --rm -t -w $(workdir) --name $(name)-r $(images) yarn r $(name)
    var docker = `docker run -i -v ${ basePath }:${ workdir }/myapp -v ${ svnConf }:${ workdir }/svnConfig --rm    --name ${ name }-r ${ images } yarn r  -releaseType=${ releaseType } -releaseMsg=${ releaseMsg }`
    // console.log('docker-', docker)
    var _this = this
    this.run(docker, function () {
      console.log('执行成功')
      _this.jmsRelease()
      _this._releaseAfter(basePath + '/project.json', releaseType, releaseMsg)
    })
  },
  'actRollback-des': `H5项目上线命令，带入参数 ：上线类型（1:测试；2:线上）,上线日志`,
  actRollback: function (releaseType, releaseMsg) {
    if (!releaseType) {
      this.log.red(
        '需要输入上线类型，1是测试，2是线上',
        'termrun actRollback [releaseType] [releaseMsg]'
      )
      return;
    }
    if (!releaseMsg) {
      this.log.red(
        '需要回滚上线日志',
        'termrun actRollback [releaseType] [releaseMsg]'
      )
      return;
    }
    // let path = require('path')
    var basePath = process.cwd()
    let workdir = '/workdir/vue'
    let name = this._getActName(basePath)
    let images = this._getImages()
    let svnConf = this._getSvnConf()
    var docker = `docker run -i -v ${ basePath }:${ workdir }/myapp -v ${ svnConf }:${ workdir }/svnConfig --rm    --name ${ name }-r ${ images } yarn rollback  -releaseType=${ releaseType } -releaseMsg=${ releaseMsg }`
    this.run(docker, function () {
      console.log('执行成功')
    })
  },
  'actNewPage-des': `H5项目新建页面命令，带入参数 ：新页面port`,
  actNewPage: function (port) {
    if (port) {
      // let libpath = this.getLibPath()
      // var docker = `start http://127.0.0.1:${ port }`
      let act = 'open'
      if (process.platform) {
        act = { darwin: 'open', win32: 'start' }[process.platform]
      }
      this.run(`${ act } http://127.0.0.1:${ port }/controller`, function () {
        console.log('执行成功')
      })
    } else {
      this.log.red('请带入端口号')
    }
  },
  'clearNoneDocker-des': `清除为none的docker镜像`,
  clearNoneDocker: function () {
    this.run(
      `docker ps -a | grep "Exited" | awk '{print $1 }'|xargs docker stop`,
      () => {
        console.log('停止none的容器-执行成功')
        this.run(
          `docker ps -a | grep "Exited" | awk '{print $1 }'|xargs docker rm`,
          () => {
            console.log('移除无效的镜像-执行成功')
            this.run(
              `docker images|grep none|awk '{print $3 }'|xargs docker rmi`,
              () => {
                console.log('删除none的镜像-执行成功')
              }
            )
          }
        )
      }
    )
  },
  'release-des': `整体上线命令`,
  release: function () {
    let workdir = '/workdir/vue'
    let images = this._getImages()
    var docker = `docker run -i   --rm  --name online-r ${ images } yarn releaseOnly`
    this.run(docker, function () {
      console.log('执行成功')
    })
  },
  'releaseManage-des': `管理上线命令`,
  releaseManage: function () {
    let cmd =
      ''
    let now = new Date()
    cmd += parseInt(now.getTime() / 1000).toString()
    this.run(cmd, function () {
      console.log('执行成功')
    })
  },
  releaseProxyApi: function () {
    let cmd =
      ''
    let now = new Date()
    cmd += parseInt(now.getTime() / 1000).toString()
    this.run(cmd, function () {
      console.log('执行成功')
    })
  },
  _releaseAfter: function (src, flag, des) {
    const fs = require('fs')
    let isJson = src.indexOf('.json') > -1
    let a = require(src)
    a.lastRelease = {
      time: new Date(),
      des: des,
      releaseMode: flag == 2 ? '线上' : '测试'
    }
    if (isJson || a.type == 'act') {
      // h5
      // fs.writeFile(src, JSON.stringify(a, null, ' '), function (err) {
      //   if (err) {
      //     console.log(src, '文件写入上线日志失败失败')
      //     return
      //   }
      //   console.log('文件写入上线记录成功')
      // })
    } else if (a.type == 'cms') {
      fs.writeFile(src, `module.exports = ` + JSON.stringify(a, null, ' '), function (err) {
        if (err) {
          console.log(src, '文件写入上线日志失败失败')
          return
        }
        console.log('文件写入上线记录成功')
      })
    } else {
      console.log(`请根据项目类型往配置文件内添加类型，h5 添加 type:'act';mis的添加 type:'cms'`)
    }
    console.log(JSON.stringify(a, null, ' '), src)
  },
  actBr: function (releaseType, releaseMsg) {
    let cmd = `termrun actBfta && termrun actRelease ${ releaseType } ${ releaseMsg }`
    this.run(cmd, function () {
      console.log('执行成功')
    })
  },
  // 打开浏览器
  _openBrowser: function (port) {
    setTimeout(() => {
      let child_process = require("child_process"),
        url = "http://" + `localhost:${ port }/`;
      if (process.platform == "wind32") {
        cmd = 'start "%ProgramFiles%Internet Exploreriexplore.exe"';
      } else if (process.platform == "linux") {
        cmd = "xdg-open";
      } else if (process.platform == "darwin") {
        cmd = "open";
      }
      child_process.exec(`${ cmd } "${ url }"`);
    }, 6000);
  },
  // 自动获取可用端口
  _portIsOccupied: function (port) {
    const net = require("net");
    const server = net.createServer().listen(port);
    return new Promise((resolve, reject) => {
      server.on("listening", () => {
        // console.log(`the server is runnint on port ${ port }`);
        server.close();
        resolve(port);
      });
      server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          resolve(this._portIsOccupied(port + 1)); //注意这句，如占用端口号+1
          // console.log(`this port ${ port } is occupied.try another.`);
        } else {
          reject(err);
        }
      });
    });
  },

}
