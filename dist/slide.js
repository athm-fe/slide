/*!
 * @autofe/slide v0.1.0
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
var DATA_API_KEY = '.data-api';
var JQUERY_NO_CONFLICT = $.fn[NAME];
var ARROW_LEFT_KEYCODE = 37; // KeyboardEvent.which value for left arrow key
var ARROW_RIGHT_KEYCODE = 39; // KeyboardEvent.which value for right arrow key

var Event = {
  INIT: 'init' + EVENT_KEY,
  SLIDE: 'slide' + EVENT_KEY, // 开始切换时触发
  SLID: 'slid' + EVENT_KEY, // 完成切换时触发
  KEYDOWN: 'keydown' + EVENT_KEY,
  MOUSEENTER: 'mouseenter' + EVENT_KEY,
  MOUSELEAVE: 'mouseleave' + EVENT_KEY,
  TOUCHEND: 'touchend' + EVENT_KEY,
  CLICK: 'click' + EVENT_KEY,
  CLICK_DATA_API: 'click' + EVENT_KEY + DATA_API_KEY
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
  this.size = this.$item.first().width();

  this.init();
}

Slide.Default = {
  duration: 400,
  interval: 5000,
  autoplay: true,
  keyboard: false,
  pause: 'hover', // 'hover', false
  toggleButton: false,
  slideTrack: '.athm-slide__track,[data-slide-track]',
  slideItem: '.athm-slide__item,[data-slide-item]',
  slideTitle: '.athm-slide__title,[data-slide-title]',
  slideIndicators: '.athm-slide__indicators,[data-slide-indicators]',
  slidePrev: '.athm-slide__prev,[data-slide-prev]',
  slideNext: '.athm-slide__next,[data-slide-next]'
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
  if (document.hasOwnProperty && document.hasOwnProperty('ontouchstart')) {
    that.$elem.on('touchstart.fe.slide', function (e) {

      e = e.originalEvent;
      that.__touch_isDrag = true;

      if (e.targetTouches) {
        that.__touch_startX = e.targetTouches[0].clientX;
        that.__touch_startY = e.targetTouches[0].clientY;
      } else {
        that.__touch_startX = e.clientX;
        that.__touch_startY = e.clientY;
      }
    }).on('touchmove.fe.slide', function (e) {
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
    }).on('touchend.fe.slide', function () {
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

  // 设置初始位置
  that.$track.css('left', 0);

  // 开启自动播放
  if (that.options.autoplay === true) {
    that.play();
  }
};

Slide.prototype.next = function () {
  if (this.buzy) {
    return;
  }
  this.buzy = true;
  this.number++;
  if (this.number > this.$item.length) {
    this.$track.css('left', this.size);

    var adjustElem = this.$item.last();
    this._adjustPosition(adjustElem, -this.$item.length * this.size);

    this.number = 1;
  }

  this._setPoint();
  this._animate();
};

Slide.prototype.prev = function () {
  if (this.buzy) {
    return;
  }
  this.buzy = true;
  this.number--;
  if (this.number <= 0) {
    this.$track.css('left', -this.$item.length * this.size);

    var adjustElem = this.$item.first();
    this._adjustPosition(adjustElem, this.$item.length * this.size);

    this.number = this.$item.length;
  }

  this._setPoint();
  this._animate();
};

Slide.prototype.go = function (index) {
  if (this.number === index) {
    return;
  }
  this.number = this.number > index ? index + 1 : index - 1;
  this[this.number > index ? 'prev' : 'next']();
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

  this.$elem.trigger(Event.SLIDE, this);

  this.$indicatorItem.removeClass(activeClass).eq(this.number - 1).addClass(activeClass);

  var $img = this.$item.eq(this.number - 1).find('img[title]');
  var title = $img.attr('title');
  if (title) {
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

Slide.prototype._animate = function () {
  var that = this;
  var duration = that.options.duration;

  that.$track.animate({
    left: -(that.number - 1) * that.size
  }, duration, function () {
    that._resetPosition();
    that.buzy = false;

    that.$elem.trigger(Event.SLID, that);
  });
};

Slide.prototype._adjustPosition = function (elem, left) {
  this.adjustObj = {
    elem: elem,
    position: elem.css('position'),
    left: elem.css('left')
  };

  elem.css({
    position: 'relative',
    left: left
  });
};

Slide.prototype._resetPosition = function () {
  if (this.adjustObj) {
    this.adjustObj.elem.css({
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