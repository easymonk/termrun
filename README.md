# termrun

termrun 一个可以自定义命令的解决方案，方便开发者快速集成自己的工具命令；使自己的非 node 工具可以在各个平台使用命令；

例如`docker`命令的集成，利用熟悉的 js 代码去拼成 要执行代码，集成起来，只需要简单`termrun dockerStart` 即可启动复杂的`docker`命令

```js
// 举例
// 命令

module.exports = {
  'actDev-des': '启动开发服务',
  actDev: function (port) {
    let path = require('path')
    var basePath = process.cwd()
    // let parentPath = path.dirname(basePath)
    let workdir = '/workdir/vue'
    let name = this._getActName(basePath)
    let images = this._getImages()
    let libpath = this.getLibPath(basePath)
    let publicPath = this._getPublic(basePath + '/src')
    port = port || 1900
    var docker = `docker run -i -v  ${basePath}:${workdir}/myapp -v ${libpath}:${workdir}/lib  ${
      publicPath ? `-v ${publicPath}:${workdir}/public` : ''
    }  --rm  -p ${port}:${port}/tcp --name ${name}-d-${port} -e PORT=${port} ${images}  yarn start  `
    console.log(docker)
    this.run(docker, function () {
      console.log('执行成功')
      console.log(docker)
    })
  },
}
// 调用
```

```bash
# termrun 调用 actDev 命令 传递端口 会执行一串复杂的docker命令
termrun actDev 1234
```

---

## 该工具用法：

> 0.4.0 新增支持在项目中调用`termrun` 命令

需要在项目目录下安装 `npm i termrun -S`

```js
const cmdrun = require('termrun')
cmdrun.run('help')
```

> 该工具已集成 Cli 命令

- `termrun init` 初始化一个自定义命令 demo，文件为 termrun.config.js，在文件中按照例子添加自己的方法即可；

- `termrun add` 添加 termrun.config.js 的方法到命令中；使用`termrun`进行调用

- `termrun del [name]` 删除 name 方法，或删除对应的 termrun.config.js 内的方法

- `termrun clear`清空方法

termrun.config.js 配置文件如下

```js
module.exports = {
  "show-des":`方法描述`
  show: function(...param) {
    console.log(...param);
  }
};
```

在编写自定义命令时可以使用`this.run('cmd',success=()=>{},error=()=>{})`来调用系统的命令；

使用 `termrun show`

> 使用 Cli 方法

全局安装 `termrun`

```bash
npm i termrun -g
```

> 自定函数可能用到的方法
>
> `this.run()` 执行系统命令
>
> `this.log()`打印数据
>
> `this.log.red()`红色输出文字

---

更新日志：

- v-0.4.0

  - 命令缓存目录替换到用户目录下的 .termrun 目录
  - 支持在项目中安装并且引用调用已经设置好的命令;
    需要在项目目录下安装 `npm i termrun -S`

    ```js
    const termrun = require('termrun')
    termrun.run('help')
    ```

- v-0.3.0
  - 添加支持自定义方法说明
