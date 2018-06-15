import $ from 'jquery';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'slide';
const DATA_KEY = 'fe.slide';
const EVENT_KEY = `.${DATA_KEY}`;
const JQUERY_NO_CONFLICT = $.fn[NAME];
const ARROW_LEFT_KEYCODE = 37;      // KeyboardEvent.which value for left arrow key
const ARROW_RIGHT_KEYCODE  = 39;    // KeyboardEvent.which value for right arrow key

const Direction = {
  NEXT: 'next',
  PREV: 'prev',
}

const Event = {
  INIT: `init${EVENT_KEY}`,
  SLIDE: `slide${EVENT_KEY}`, // 开始切换时触发
  SLID: `slid${EVENT_KEY}`, // 完成切换时触发
  FIRST_SLIDE: `firstSlide${EVENT_KEY}`,
  FIRST_SLID: `firstSlid${EVENT_KEY}`,
  LAST_SLIDE: `lastSlide${EVENT_KEY}`,
  LAST_SLID: `lastSlid${EVENT_KEY}`,
  KEYDOWN: `keydown${EVENT_KEY}`,
  MOUSEENTER: `mouseenter${EVENT_KEY}`,
  MOUSELEAVE: `mouseleave${EVENT_KEY}`,
  CLICK: `click${EVENT_KEY}`,
};

const Selector = {
  DATA_TOGGLE: '[data-toggle="slide"]',
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
  this.$prev = $(this.options.slidePrev, this.$elem);
  this.$next = $(this.options.slideNext, this.$elem);

  this.number = 1;
  this.buzy = false;
  this.isMouseEnter = false; // 用来标识鼠标是否在焦点图内
  this.adjustObj = null;

  this.init();
}

Slide.Default = {
  fade: false,
  duration: 400,
  interval: 5000,
  circle: true,
  autoplay: true,
  keyboard: false,
  pause: 'hover', // 'hover', false
  toggleButton: false,
  autoIndicators: false,
  slideTrack: '.athm-slide__track,[data-slide-track]',
  slideItem: '.athm-slide__item,[data-slide-item]',
  slideTitle: '.athm-slide__title,[data-slide-title]',
  slideIndicators: '.athm-slide__indicators,[data-slide-indicators]',
  slidePrev: '.athm-slide__prev,[data-slide-prev]',
  slideNext: '.athm-slide__next,[data-slide-next]',
  disabledClass: 'disabled',
};

Slide.prototype.init = function () {
  const that = this;

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
    that.$elem
      .on(Event.MOUSEENTER, function () {
        that.isMouseEnter = true;
      })
      .on(Event.MOUSELEAVE, function () {
        that.isMouseEnter = false;
      });
  }

  // 如果 toggleButton 为 true，则切换显示
  if (that.options.toggleButton === true) {
    that.$elem
      .on(Event.MOUSEENTER, function () {
        that.$prev.show();
        that.$next.show();
      })
      .on(Event.MOUSELEAVE, function () {
        that.$prev.hide();
        that.$next.hide();
      });
  }

  // 左右按钮支持
  that.$prev.on(Event.CLICK, $.proxy(that.prev, that));
  that.$next.on(Event.CLICK, $.proxy(that.next, that));

  if (that.options.autoIndicators) {
    const list = [];
    for (let i = 0, len = that.$item.length; i < len; i++) {
      list.push('<a href="javascript:void(0)" target="_self"></a>');
    }
    that.$indicators.html(list.join(' '));
  }

  // 触发点支持
  that.$indicators.on(Event.CLICK, 'a', function () {
    if (that.buzy) {
      return;
    }
    const index = that.$indicators.find('a').index(this) + 1;
    that.go(index);
  });

  // 键盘左右切换支持
  that._keydownHook = that._keydown.bind(that);
  that.options.keyboard && $(document).on(Event.KEYDOWN, that._keydownHook);

  // 设置初始位置
  if (that.options.fade) {
    that.$item.css({
      opacity: 0,
      position: 'absolute',
      zIndex: 1
    }).eq(0).css({
      opacity: 1,
      zIndex: 2
    });
  } else {
    that.$track.css('left', 0);
  }

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

  const direction = index > this.number
    ? Direction.NEXT
    : Direction.PREV;

  this._slide(direction, index);
};

Slide.prototype.play = function () {
  const that = this;

  this.interval && clearInterval(this.interval);
  this.buzy = false;
  this.interval = setInterval(function() {
    !that.isMouseEnter && that.next();
  }, this.options.interval);
};

Slide.prototype.pause = function () {
  this.interval && clearInterval(this.interval);
};

Slide.prototype._setPoint = function () {
  const activeClass = 'active';

  this.$indicators.find('a').removeClass(activeClass).eq(this.number - 1).addClass(activeClass);

  const $current = this.$item.eq(this.number - 1);
  const $img = $current.find('img[title]');
  const title = $img.attr('title');
  if (title && this.$title.length > 0) {
    let linkNode = $img.closest('a', $current[0])[0];

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
  const that = this;
  const duration = this.options.duration;
  const disabledClass = this.options.disabledClass;
  const size = this.$item.first().width();

  // 状态信息
  const isCircle = this.options.circle;
  const isLast = direction === Direction.NEXT && index === this.$item.length;
  const isLastMore = direction === Direction.NEXT && index > this.$item.length;
  const isFirst = direction === Direction.PREV && index === 1;
  const isFirstMore = direction === Direction.PREV && index < 1;

  const oldNumber = this.number;
  let _index = index;

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
    if (!this.options.fade) {
      this.$track.css('left', size);

      const $adjustElem = this.$item.last();
      this._adjustPosition($adjustElem, -this.$item.length * size);
    }

    _index = 1;
  } else if (isFirstMore) {
    if (!this.options.fade) {
      this.$track.css('left', -this.$item.length * size);

      const $adjustElem = this.$item.first();
      this._adjustPosition($adjustElem, this.$item.length * size);
    }

    _index = this.$item.length;
  }

  this.number = _index;

  this._setPoint();

  if (that.options.fade) {
    that.$item.eq(oldNumber - 1).animate({opacity: 0}, duration, function () {
      $(this).css('zIndex', 1);
    });
    that.$item.eq(that.number - 1).animate({opacity: 1}, duration, function () {
      $(this).css('zIndex', 2);

      animateCallback();
    });
  } else {
    that.$track.animate({
      left: -(that.number - 1) * size
    }, duration, function () {
      that._resetPosition();

      animateCallback();
    });
  }

  function animateCallback() {
    that.buzy = false;

    that.$elem.trigger(Event.SLID, that);

    if (!isCircle && isLast) {
      that.$elem.trigger(Event.LAST_SLID, that);
    } else if (!isCircle && isFirst) {
      that.$elem.trigger(Event.FIRST_SLID, that);
    }
  }
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

Slide.prototype._keydown = function (e) {
  if (/input|textarea/i.test(e.target.tagName)) {
    return;
  }

  switch (e.which) {
    case ARROW_LEFT_KEYCODE:
      this.prev();
      break;
    case ARROW_RIGHT_KEYCODE:
      this.next();
      break;
  }
}

Slide.prototype.destroy = function () {
  // 停止轮播
  this.pause();

  // 立刻结束动画
  this.$item.stop(true, true);
  this.$track.stop(true, true);

  // 解除事件绑定
  this.$elem.off(EVENT_KEY);
  this.$prev.off(Event.CLICK);
  this.$next.off(Event.CLICK);
  this.$indicators.off(Event.CLICK);
  $(document).off(Event.KEYDOWN, this._keydownHook);

  // 删除 DOM 节点上的对象缓存
  this.$elem.removeData(DATA_KEY);

  // 删除引用
  this.options = null;
  this.$elem = null;
  this.$track = null;
  this.$item = null;
  this.$title = null;
  this.$indicators = null;
  this.$prev = null;
  this.$next = null;
  this.adjustObj = null;
}

/**
 * ------------------------------------------------------------------------
 * Plugin Definition
 * ------------------------------------------------------------------------
 */

function Plugin(config) {
  return this.each(function () {
    const $this = $(this);
    let data = $this.data(DATA_KEY);
    const _config = $.extend({}, Slide.Default, $this.data(), typeof config === 'object' && config);

    if (!data) {
      data = new Slide(this, _config);
      $this.data(DATA_KEY, data);
    }

    if (typeof config === 'string') {
      if (typeof data[config] === 'undefined') {
        throw new TypeError(`No method named "${config}"`);
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
}

export default Slide;
