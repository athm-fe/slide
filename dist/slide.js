/*!
 * @autofe/slide v0.2.0
 * (c) 2018 Autohome Inc.
 * Released under the MIT License.
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('jquery')) :
	typeof define === 'function' && define.amd ? define(['jquery'], factory) :
	(global.AutoFE = global.AutoFE || {}, global.AutoFE.Slide = factory(global.jQuery));
}(this, (function ($) { 'use strict';

$ = $ && $.hasOwnProperty('default') ? $['default'] : $;

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

var NAME = 'slide';
var DATA_KEY = 'fe.slide';
var EVENT_KEY = '.' + DATA_KEY;
var JQUERY_NO_CONFLICT = $.fn[NAME];
var ARROW_LEFT_KEYCODE = 37; // KeyboardEvent.which value for left arrow key
var ARROW_RIGHT_KEYCODE = 39; // KeyboardEvent.which value for right arrow key

var Direction = {
  NEXT: 'next',
  PREV: 'prev'
};

var Event = {
  INIT: 'init' + EVENT_KEY,
  SLIDE: 'slide' + EVENT_KEY, // 开始切换时触发
  SLID: 'slid' + EVENT_KEY, // 完成切换时触发
  FIRST_SLIDE: 'firstSlide' + EVENT_KEY,
  FIRST_SLID: 'firstSlid' + EVENT_KEY,
  LAST_SLIDE: 'lastSlide' + EVENT_KEY,
  LAST_SLID: 'lastSlid' + EVENT_KEY,
  KEYDOWN: 'keydown' + EVENT_KEY,
  MOUSEENTER: 'mouseenter' + EVENT_KEY,
  MOUSELEAVE: 'mouseleave' + EVENT_KEY,
  TOUCHSTART: 'touchstart' + EVENT_KEY,
  TOUCHMOVE: 'touchmove' + EVENT_KEY,
  TOUCHEND: 'touchend' + EVENT_KEY,
  CLICK: 'click' + EVENT_KEY
};

var Selector = {
  DATA_TOGGLE: '[data-toggle="slide"]'
};

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

function Slide(elem, options) {
  this.options = options;
  this.$elem = $(elem);
  this.$track = $(this.options.slideTrack, this.$elem);
  this.$item = $(this.options.slideItem, this.$elem);
  this.$title = $(this.options.slideTitle, this.$elem);
  this.$indicators = $(this.options.slideIndicators, this.$elem);
  this.$indicatorItem = $('a', this.$indicators);
  this.$prev = $(this.options.slidePrev, this.$elem);
  this.$next = $(this.options.slideNext, this.$elem);

  this.number = 1;
  this.buzy = false;
  this.isMouseEnter = false; // 用来标识鼠标是否在焦点图内
  this.adjustObj = null;

  this.init();
}

Slide.Default = {
  duration: 400,
  interval: 5000,
  circle: true,
  autoplay: true,
  keyboard: false,
  pause: 'hover', // 'hover', false
  toggleButton: false,
  slideTrack: '.athm-slide__track,[data-slide-track]',
  slideItem: '.athm-slide__item,[data-slide-item]',
  slideTitle: '.athm-slide__title,[data-slide-title]',
  slideIndicators: '.athm-slide__indicators,[data-slide-indicators]',
  slidePrev: '.athm-slide__prev,[data-slide-prev]',
  slideNext: '.athm-slide__next,[data-slide-next]',
  disabledClass: 'disabled'
};

Slide.prototype.init = function () {
  var that = this;

  // 内容不够, 不需要初始化
  if (that.$item.length <= 1) {
    that.$indicators.hide();
    that.$prev.hide();
    that.$next.hide();
    return;
  }

  // 初始化回调
  that.$elem.trigger(Event.INIT, that);

  // 鼠标悬停
  if (that.options.pause === 'hover') {
    that.$elem.on(Event.MOUSEENTER, function () {
      that.isMouseEnter = true;
    }).on(Event.MOUSELEAVE, function () {
      that.isMouseEnter = false;
    });
  }

  // 如果 toggleButton 为 true，则切换显示
  if (that.options.toggleButton === true) {
    that.$elem.hover(function () {
      that.$prev.show();
      that.$next.show();
    }, function () {
      that.$prev.hide();
      that.$next.hide();
    });
  }

  // 左右按钮支持
  that.$prev.on(Event.CLICK, $.proxy(that.prev, that));
  that.$next.on(Event.CLICK, $.proxy(that.next, that));

  // 触发点支持
  that.$indicatorItem.on(Event.CLICK, function () {
    if (that.buzy) {
      return;
    }
    var index = that.$indicatorItem.index($(this)) + 1;
    that.go(index);
  });

  // 键盘左右切换支持
  that.options.keyboard && $(document).on(Event.KEYDOWN, function (e) {
    switch (e.which) {
      case ARROW_LEFT_KEYCODE:
        that.prev();
        break;
      case ARROW_RIGHT_KEYCODE:
        that.next();
        break;
    }
  });

  // Touch 支持
  if ('ontouchstart' in window) {
    that.$elem.on(Event.TOUCHSTART, function (e) {

      e = e.originalEvent;
      that.__touch_isDrag = true;

      if (e.targetTouches) {
        that.__touch_startX = e.targetTouches[0].clientX;
        that.__touch_startY = e.targetTouches[0].clientY;
      } else {
        that.__touch_startX = e.clientX;
        that.__touch_startY = e.clientY;
      }
    }).on(Event.TOUCHMOVE, function (e) {
      e = e.originalEvent;

      if (that.__touch_isDrag) {
        if (e.targetTouches) {
          that.__touch_endX = e.targetTouches[0].clientX;
          that.__touch_endY = e.targetTouches[0].clientY;
        } else {
          that.__touch_endX = e.clientX;
          that.__touch_endY = e.clientY;
        }

        if (Math.abs(that.__touch_endX - that.__touch_startX) > Math.abs(that.__touch_endY - that.__touch_startY)) {
          that.__touch_horizontal = true;
          e.preventDefault();
        } else {
          that.__touch_horizontal = false;
        }
      }
    }).on(Event.TOUCHEND, function () {
      if (that.__touch_horizontal && that.__touch_endX) {
        if (that.__touch_endX - that.__touch_startX > 100) {
          $.proxy(that.prev, that)();
        } else if (that.__touch_endX - that.__touch_startX < -100) {
          $.proxy(that.next, that)();
        }
      }
      that.__touch_isDrag = false;
      that.__touch_startX = null;
      that.__touch_startY = null;
      that.__touch_endX = null;
      that.__touch_endY = null;
    });
  }

  // TODO 这里可以优化一下
  // 设置初始位置
  that.$track.css('left', 0);
  // 设置 Indicator 和 Title
  that._setPoint();
  // 设置按钮状态
  if (!that.options.circle && that.number === 1) {
    that.$prev.addClass(this.options.disabledClass);
  }

  // 开启自动播放
  if (that.options.autoplay === true) {
    that.play();
  }
};

Slide.prototype.next = function () {
  if (!this.buzy) {
    this._slide(Direction.NEXT, this.number + 1);
  }
};

Slide.prototype.prev = function () {
  if (!this.buzy) {
    this._slide(Direction.PREV, this.number - 1);
  }
};

Slide.prototype.go = function (index) {
  if (index > this.$item.length || index < 1) {
    return;
  }

  if (index === this.number) {
    return;
  }

  if (this.buzy) {
    return;
  }

  var direction = index > this.number ? Direction.NEXT : Direction.PREV;

  this._slide(direction, index);
};

Slide.prototype.play = function () {
  var that = this;

  this.interval && clearInterval(this.interval);
  this.buzy = false;
  this.interval = setInterval(function () {
    !that.isMouseEnter && that.next();
  }, this.options.interval);
};

Slide.prototype.pause = function () {
  this.interval && clearInterval(this.interval);
};

Slide.prototype._setPoint = function () {
  var activeClass = 'active';

  this.$indicatorItem.removeClass(activeClass).eq(this.number - 1).addClass(activeClass);

  var $img = this.$item.eq(this.number - 1).find('img[title]');
  var title = $img.attr('title');
  if (title && this.$title.length > 0) {
    var linkNode = $img.parent('a')[0];

    if (linkNode) {
      linkNode = linkNode.cloneNode();
    } else {
      linkNode = document.createElement('a');
      linkNode.href = 'javascript:void(0)';
    }
    linkNode.innerHTML = title;

    this.$title.html(linkNode.outerHTML);
  }
};

Slide.prototype._slide = function (direction, index) {
  var that = this;
  var duration = this.options.duration;
  var disabledClass = this.options.disabledClass;
  var size = this.$item.first().width();

  // 状态信息
  var isCircle = this.options.circle;
  var isLast = direction === Direction.NEXT && index === this.$item.length;
  var isLastMore = direction === Direction.NEXT && index > this.$item.length;
  var isFirst = direction === Direction.PREV && index === 1;
  var isFirstMore = direction === Direction.PREV && index < 1;

  // const oldIndex = this.number;
  var _index = index;

  // 不允许循环播放
  if (!isCircle && (isFirstMore || isLastMore)) {
    return;
  }

  // 设置为切换中
  this.buzy = true;

  this.$elem.trigger(Event.SLIDE, this);

  if (!isCircle && isLast) {
    this.$next.addClass(disabledClass);
    this.$elem.trigger(Event.LAST_SLIDE, this);

    // 停止轮播
    this.pause();
  } else {
    this.$next.removeClass(disabledClass);
  }

  if (!isCircle && isFirst) {
    this.$prev.addClass(disabledClass);
    this.$elem.trigger(Event.FIRST_SLIDE, this);
  } else {
    this.$prev.removeClass(disabledClass);
  }

  if (isLastMore) {
    this.$track.css('left', size);

    var $adjustElem = this.$item.last();
    this._adjustPosition($adjustElem, -this.$item.length * size);

    _index = 1;
  } else if (isFirstMore) {
    this.$track.css('left', -this.$item.length * size);

    var _$adjustElem = this.$item.first();
    this._adjustPosition(_$adjustElem, this.$item.length * size);

    _index = this.$item.length;
  }

  this.number = _index;

  this._setPoint();

  that.$track.animate({
    left: -(that.number - 1) * size
  }, duration, function () {
    that._resetPosition();
    that.buzy = false;

    that.$elem.trigger(Event.SLID, that);

    if (!isCircle && isLast) {
      that.$elem.trigger(Event.LAST_SLID, that);
    } else if (!isCircle && isFirst) {
      that.$elem.trigger(Event.FIRST_SLID, that);
    }
  });
};

Slide.prototype._adjustPosition = function ($elem, left) {
  this.adjustObj = {
    $elem: $elem,
    position: $elem.css('position'),
    left: $elem.css('left')
  };

  $elem.css({
    position: 'relative',
    left: left
  });
};

Slide.prototype._resetPosition = function () {
  if (this.adjustObj) {
    this.adjustObj.$elem.css({
      position: this.adjustObj.position,
      left: this.adjustObj.left
    });
    this.adjustObj = null;
  }
};

/**
 * ------------------------------------------------------------------------
 * Plugin Definition
 * ------------------------------------------------------------------------
 */

function Plugin(config) {
  return this.each(function () {
    var $this = $(this);
    var data = $this.data(DATA_KEY);
    var _config = $.extend({}, Slide.Default, $this.data(), typeof config === 'object' && config);

    if (!data) {
      data = new Slide(this, _config);
      $this.data(DATA_KEY, data);
    }

    if (typeof config === 'string') {
      if (typeof data[config] === 'undefined') {
        throw new TypeError('No method named "' + config + '"');
      }
      data[config]();
    } else if (typeof config === 'number') {
      data.go(config);
    }
  });
}

/**
 * ------------------------------------------------------------------------
 * Data Api implementation
 * ------------------------------------------------------------------------
 */

$(function () {
  Plugin.call($(Selector.DATA_TOGGLE));
});

/**
 * ------------------------------------------------------------------------
 * jQuery
 * ------------------------------------------------------------------------
 */

$.fn[NAME] = Plugin;
$.fn[NAME].Constructor = Slide;
$.fn[NAME].noConflict = function () {
  $.fn[NAME] = JQUERY_NO_CONFLICT;
  return Plugin;
};

return Slide;

})));
