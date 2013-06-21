module.exports = {
  help: [
    {
      menuName: t('dialogs.help.blockElements.title'),
      content: [{
          menuName: t('dialogs.help.blockElements.content.paragraphs.title'),
          data: t('dialogs.help.blockElements.content.paragraphs.content')
        }, {
          menuName: t('dialogs.help.blockElements.content.headers.title'),
          data: t('dialogs.help.blockElements.content.headers.content')
        }, {
          menuName: t('dialogs.help.blockElements.content.blockquotes.title'),
          data: t('dialogs.help.blockElements.content.blockquotes.content')
        }, {
          menuName: t('dialogs.help.blockElements.content.lists.title'),
          data: t('dialogs.help.blockElements.content.lists.content')
        }, {
          menuName: t('dialogs.help.blockElements.content.codeBlocks.title'),
          data: t('dialogs.help.blockElements.content.codeBlocks.content')
        }, {
          menuName: t('dialogs.help.blockElements.content.horizontalRules.title'),
          data: t('dialogs.help.blockElements.content.horizontalRules.content')
        }
      ]
    },

    {
      menuName: t('dialogs.help.spanElements.title'),
      content: [{
          menuName: t('dialogs.help.spanElements.content.links.title'),
          data: t('dialogs.help.spanElements.content.links.content')
        },
        {
          menuName: t('dialogs.help.spanElements.content.emphasis.title'),
          data: t('dialogs.help.spanElements.content.emphasis.content')
        },
        {
          menuName: t('dialogs.help.spanElements.content.code.title'),
          data: t('dialogs.help.spanElements.content.code.content')
        },
        {
          menuName: t('dialogs.help.spanElements.content.images.title'),
          data: t('dialogs.help.spanElements.content.images.content')
        }
      ]
    },

    {
      menuName: t('dialogs.help.miscellaneous.title'),
      content: [{
          menuName: t('dialogs.help.miscellaneous.content.automaticLinks.title'),
          data: t('dialogs.help.miscellaneous.content.automaticLinks.content')
        },
        {
          menuName: t('dialogs.help.miscellaneous.content.escaping.title'),
          data: t('dialogs.help.miscellaneous.content.escaping.content')
        }
      ]
    }
  ]
}
