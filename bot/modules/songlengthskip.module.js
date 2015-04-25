const debug = require('debug')('bot:vote-skip')
const assign = require('object-assign')
const BotModule = require('../Module')

export default class SongLengthSkip extends BotModule {

  constructor(bot, options = {}) {
    super(bot, options)

    this.author = 'J'
    this.version = '0.1.1'
    this.description = 'Autoskip songs that are too long.'

    this.onAdvance = this.onAdvance.bind(this)
  }

  defaultOptions() {
    return {
      limit: 7 * 60
    }
  }

  init() {
    this._skipping = false
    this.bot.on(this.bot.ADVANCE, this.onAdvance)
  }

  destroy() {
    this.bot.removeListener(this.bot.ADVANCE, this.onAdvance)
  }

  onAdvance(booth, { media }) {
    if (media.duration > this.options.limit) {
      let seconds = this.options.limit % 60
      let formatted = `${Math.floor(this.options.limit / 60)}:${seconds < 10 ? `0${seconds}` : seconds}`
      // TODO get something nicer than this ):
      this.bot.onMessage({
        message: `!lockskip "This song is longer than the maximum of ${formatted}. Please pick a shorter one."`,
        id: 'bot'
      })
    }
  }

}
