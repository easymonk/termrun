
const path = require('path')
const fs = require('fs-extra')
const chalk = require('chalk')
var shell = require('shelljs') // 这里要下载shell插件
// 增加 默认目录到 用户目录下
const os = require('os')
const confPath = path.join(os.homedir(), './.termrun/')
const confPathSelf = path.join(__dirname, '../userConf/slef_conf.js')
const confFilePath = path.join(os.homedir(), './.termrun/conf.js')

// 新版本使用用户目录做配置信息
fs.ensureDir(confPath)
fs.ensureFileSync(confPathSelf)
fs.ensureFileSync(confFilePath)
// 判断老目录下是否有文件有的话直接复制到新的目录下
if (fs.existsSync(path.join(__dirname, '../userConf/conf.js'))) {
  // 若有文件 copy过去 删除用户目录下文件
  fs.copyFile(path.join(__dirname, '../userConf/conf.js'), confFilePath)
  fs.copyFile(path.join(__dirname, '../userConf/conf.js'), confPathSelf)
  // 删除本地
  fs.unlinkSync(path.join(__dirname, '../userConf/conf.js'))
}
if (!fs.existsSync(confPathSelf)) {
  syncFile()
}
const strBy = [
  '当你遇到难点的时候，你应该庆幸，你又要提高了！',
  '喜欢折腾就开始造吧！',
  '开拓你的思维，没有什么技术难点，只是没有想到而已！',
  '技能是靠经验打磨出来的！',
  '前端发展很快，一不留神就会跟不上的；所以请不断学习'
]
const tips = chalk.blueBright('comrun:\n    ')
let userConf = {}
function log (...msg) {
  console.log(...msg)
}
log.red = function (...msg) {
  log(chalk.red(...msg))
}
log.yellow = function (...msg) {
  log(chalk.yellow(...msg))
}
log.green = function (...msg) {
  log(chalk.green(...msg))
}
let userCall = {
  __runName: '',
  log: log,
  run: function (cmd, success = () => { }, error = () => { }) {
    try {
      shell.exec(cmd, (err, stdout, stderr) => {
        if (err) {
          console.log('term run fail：' + cmd)
          console.log(getgrayStr('error info start:-------------'))
          console.log(getgrayStr(stdout))
          console.log(getgrayStr('error info end:-------------'))
          console.log(getDesStr(this.__runName, this[this.__runName + '-des']))
          error()
          process.exit(1)
        }
        // console.log(stdout)
        success()
      })
    } catch (e) {
      console.log(e)
      error()
    }
  }
}
function make_red (txt) {
  return chalk.magentaBright(' \n', txt, ' \n', getStr())
}
function getStr () {
  return chalk.gray(
    ' \n',
    strBy[parseInt(Math.random() * strBy.length)],
    '  --by zhengguozhi',
    ' \n'
  )
}
function doUrl (type, paths, params) {
  let bspath = process.cwd()
  let pathsConf = ''
  switch (type) {
    case 'init':
      fs.copyFileSync(
        path.join(__dirname, '../userConf/demoConf.js'),
        path.join(bspath, './termrun.config.js')
      )
      console.log('命令初始化成功')
      break
    case 'clear':
      fs.copyFileSync(
        path.join(__dirname, '../userConf/demoConf.js'),
        confFilePath
      )
      syncFile()
      console.log('命令已镜清理成功')
      break
    case 'set':
      // 整个设置
      try {
        pathsConf = path.join(
          bspath,
          typeof paths === 'string' ? paths : './termrun.config.js'
        )
        if (fs.existsSync(pathsConf)) {
          fs.copyFileSync(pathsConf, confFilePath)
          syncFile()
          console.log(
            '用户命令配置设置成功 可以使用',
            chalk.magentaBright('termrun [fnName] [...params]'),
            ' 去调用命令'
          )
        } else {
          console.log('请确保', pathsConf, '文件存在')
          process.exit(0)
        }
      } catch (e) {
        console.log(e)
        process.exit(0)
      }
      break
    case 'del':
      // 整个设置
      try {
        let delname = ''
        if (typeof paths === 'string') {
          delname = paths
        } else {
          pathsConf = path.join(
            bspath,
            typeof paths === 'string' ? paths : './termrun.config.js'
          )
        }
        if (pathsConf || delname) {
          let conf = {}
          if (fs.existsSync(pathsConf)) {
            conf = require(pathsConf)
          }
          if (delname) {
            conf[delname] = true
          }
          Object.keys(conf).forEach((v) => {
            if (v.indexOf('-des') < 0) {
              if (!conf[v + '-des']) {
                conf[v + '-des'] = true
              }
            }
          })
          const nowConfPath = confFilePath
          let nowStrnowHasConf = require(nowConfPath)
          recordLastEditTime(nowStrnowHasConf)
          let newStr = ''
          let newStrkey = []
          // del same
          for (let key2 in nowStrnowHasConf) {
            if (!conf[key2]) {
              newStrkey.push(key2)
              newStr += `${ getKey(key2) }: ${ getValue(nowStrnowHasConf[key2]) },
`
            }
          }
          fs.writeFileSync(
            nowConfPath,
            'module.exports = {' + newStr.substr(0, newStr.length - 1) + '}'
          )
          syncFile()
          console.log('用户命令删除成功')
        } else {
          console.log('请确保', pathsConf, '文件存在')
          process.exit(0)
        }
      } catch (e) {
        console.log(e)
        process.exit(0)
      }
      break
    case 'add':
      // 整个设置
      try {
        pathsConf = path.join(
          bspath,
          typeof paths === 'string' ? paths : './termrun.config.js'
        )
        if (fs.existsSync(pathsConf)) {
          const conf = require(pathsConf)
          const nowConfPath = confFilePath
          let nowStrnowHasConf = require(nowConfPath)
          if (typeof nowStrnowHasConf === 'string') {
            nowStrnowHasConf = {}
          }
          let newStr = ''
          let newStrkey = []
          // add
          recordLastEditTime(conf)
          for (let key in conf) {
            newStrkey.push(key)
            newStr += `${ getKey(key) }: ${ getValue(conf[key]) },
`
          }
          // del same
          for (let key2 in nowStrnowHasConf) {
            if (!conf[key2]) {
              newStrkey.push(key2)
              newStr += `${ getKey(key2) }: ${ getValue(nowStrnowHasConf[key2]) },
`
            }
          }
          Object.assign(nowStrnowHasConf, conf)
          fs.writeFileSync(
            nowConfPath,
            'module.exports = {' + newStr.substr(0, newStr.length - 1) + '}'
          )
          syncFile()
          console.log(
            '用户命令配置设置成功 可以使用',
            chalk.magentaBright('termrun [fnName] [...params]'),
            ' 去调用命令'
          )
        } else {
          console.log('请确保', pathsConf, '文件存在')
          process.exit(0)
        }
      } catch (e) {
        console.log(e)
        process.exit(0)
      }
      break
    default:
      let copyFn = {}
      try {
        copyFn = require('../userConf/copy')
      } catch (e) { }
      userConf = Object.assign(require(confPathSelf), copyFn || {})
      if (userConf[type]) {
        if (type[0] === '_') {
          console.log(chalk.redBright('内部命令不能直接调用，请更改命令'))
        } else {
          if (type.indexOf('-des') > -1) {
            console.log(getDesStr(type, userConf[type]))
          } else {
            if (typeof userConf[type] === 'function') {
              userConf[type].call(
                Object.assign(userConf, userCall, { __runName: type }),
                typeof paths === 'string' ? paths : '',
                ...params.map((v) => (typeof v === 'string' ? v : ''))
              )
            } else {
              console.log(
                chalk.redBright('用户自定义命令', type, '应该是一个function')
              )
            }
          }
        }
      } else {
        showinfo('uncaught command')
      }
      break
  }
}
function getKey (key) {
  return `'${ key }'`
}
function getValue (value) {
  return typeof value === 'string' ? `'${ value.replace(/'/g, "\\'") }'` : value
}
function getDesStr (type, value) {
  return `${ chalk.blueBright(
    '用户自定义命令[',
    type.replace('-des', ''),
    ']的描述：'
  ) }
${ chalk.blueBright(typeof value === 'function' ? value() : value) } `
}
function getgrayStr (...str) {
  return chalk.gray(...str)
}
function syncFile () {
  if (fs.existsSync(confFilePath)) {
    fs.copyFileSync(confFilePath, confPathSelf)
  }
}

function recordLastEditTime (conf) {
  conf._lastEditTime = `'${ new Date() }'`
  conf.lastEditTime = function () {
    console.log(this._lastEditTime)
  }
}
function showinfo (errInfo = '') {
  if (errInfo) console.log(chalk.red(`ERROR: ${ errInfo } `))
  console.log()
  console.log(' Examples:')
  console.log()
  console.log(chalk.gray('    # add function'))
  console.log('    $ termrun add [path]')
  console.log()
  console.log(chalk.gray('    # del fucntion'))
  console.log('    $ termrun del <path>')
  console.log()
  console.log(chalk.gray('    # 自定义命令'))
  console.log()
  console.log()

  userConf = require(confFilePath)
  for (var i in userConf) {
    if (i.indexOf('-des') < 0 && i[0] !== '_') {
      userConf[i + '-des'] &&
        console.log(chalk.gray('    # ' + userConf[i + '-des']))
      console.log('    $ termrun ' + i + ' ')
      console.log()
    }
  }
  console.log()
  console.log()
  console.log(`

  termrun 内置方法有:
  this.run(cmd[,call]) 执行命令
  this.log.red('') 输出红色的文字
  this.log.yellow('') 输出黄色的文字
  this.log.green('') 输出绿色的文字
  
  `)
}
function run (cmdName, cmdText, ...param) {
  doUrl(cmdName, cmdText, param)
}
module.exports = { showinfo, doUrl, make_red, getgrayStr, run }
