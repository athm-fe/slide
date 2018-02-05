# Slide

## TODO

* Touch 支持

## HTML 结构要求

一般情况下使用 `.athm-slide-*` 风格的类名即可, 但是如果你有自定义的 class 名字，你可以通过配置 `data-slide-*` 风格的属性来配置对应的节点.

```
.athm-slide
  .athm-slide__inner  // overflow: hidden
    .athm-slide__track,[data-slide-track] // position: relative; width: 9999em;
      > .athm-slide__item,[data-slide-item] // float: left;
        a > img[title]
      > .athm-slide__item,[data-slide-item] // float: left;
      > .athm-slide__item,[data-slide-item] // float: left;
      ...
  .athm-slide__prev,[data-slide-prev]
  .athm-slide__next,[data-slide-next]
  .athm-slide__indicators,[data-slide-indicators]
    > a.active
    > a
    > a
    ...
  .athm-slide__title,[data-slide-title]
    > a
```

## Usage

可以通过两种方式来初始化 Slide 控件, 你可以根据自己的需要来进行选择.

```javascript
$('#slide').slide(options);
```

```html
<div class="athm-slide" data-toggle="slide">
  ...
</div>
```

## Options

参数可以通过 data attributes 或者 JavaScript 两种方式来配置.

Name | Type | Default | Description
---- | ---- | ------- | -----------
duration | number | 400 | 动画的时长, 以毫秒为单位.
interval | number | 5000 | 自动播放间隔时间, 以毫秒为单位.
circle | boolean | true | 是否循环.
autoplay | boolean | true | 是否开启自动轮播.
keyboard | boolean | false | 开启左右快捷键操作, 默认关闭.
pause | string or boolean | `'hover'` | 鼠标在区域内时暂停循环, 如果想取消改功能, 可以取值 `false` .
toggleButton | boolean | false | 鼠标移入时是否显示左右箭头.
autoIndicators | boolean | false | 自动创建导航器

## Methods

### `.slide(options)`

初始化当前 DOM 内容为一个 Slide , 可以接受参数进行配置.

```javascript
$('#slide').slide({});
```

### `.slide('next')`

前进到下一帧.

```javascript
$('#slide').slide('next');
```

### `.slide('prev')`

返回到上一帧.

```javascript
$('#slide').slide('prev');
```

### `.slide('pause')`

暂停播放.

```javascript
$('#slide').slide('pause');
```

### `.slide('play')`

开始播放.

```javascript
$('#slide').slide('play');
```

### `.slide(number)`

前进到第几帧(从1开始).

```javascript
$('#slide').slide(3);
```


## Event

Event Type | Description
---------- | -----------
init.fe.slide | 初始化时触发.
slide.fe.slide | 开始切换到下一帧时, 此事件会立即触发.
slid.fe.slide | 切换完毕时触发.
firstSlide.fe.slide | 开始切换到第一帧时触发, 仅限 `circle: false`.
firstSlid.fe.slide | 完成切换到第一帧时触发, 仅限 `circle: false`.
lastSlide.fe.slide | 开始切换到最后一帧时触发, 仅限 `circle: false`.
lastSlid.fe.slide | 完成切换到最后一帧时触发, 仅限 `circle: false`.

```javascript
$('#slide').on('slid.fe.slide', function (e, slide) {
  // 打印当前是第几帧
  console.log('slid', slide.number);
});
```

# End

Thanks to [Bootstrap](http://getbootstrap.com/)