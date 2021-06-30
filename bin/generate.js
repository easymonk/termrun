#!/usr/bin / env node


const program = require('commander')

const { doUrl, showinfo, getgrayStr } = require('../src/index')
// release online
// const childProcess = require('child_process')
// 载入用户配置

/**
 * Usage.
 */
program
  .command('init ')
  .description('get a termrun.config.js file in here')
  .action(function (pathUrl, ...other) {
    doUrl('init', pathUrl)
  }).on('--help', function () {
    showinfo()
  })
program
  .command('add ')
  .description('add a commander ')
  .action(function (pathUrl, ...other) {
    doUrl('add', pathUrl)
  }).on('--help', function () {
    showinfo()
  })
program
  .command('del [name]')
  .description('del a commander')
  .action(function (name, floderName, doStyle) {
    doUrl('del', name, floderName, doStyle)
  }).on('--help', function () {
    showinfo()
  })
program
  .command('clear ')
  .description('clear  commander ')
  .action(function (pathUrl, ...other) {
    doUrl('clear', pathUrl)
  }).on('--help', function () {
    showinfo()
  })
if (!process.argv.slice(2).length) {
  program.outputHelp(make_red)
}
program
  .command('*')
  .action(function (cmdName, cmdText, ...param) {
    doUrl(cmdName, cmdText, param)
    // showinfo('uncaught command : ' + cmdName)
  }).on('--help', function () {
    showinfo()
  })

program.parse(process.argv)
