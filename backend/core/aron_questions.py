"""Arthur Aron's 36 Questions That Lead to Love — Chinese localization."""

from typing import Optional

QUESTIONS: list[dict] = [
    {
        "id": 1, "group": 1,
        "zh": '如果可以邀请世界上任何人共进晚餐，你会选择谁？',
        "localized_zh": '如果可以邀请世界上任何人共进晚餐，你会选择谁？',
        "en": 'Given the choice of anyone in the world, whom would you want as a dinner guest?',
    },
    {
        "id": 2, "group": 1,
        "zh": '你想成为名人吗？以什么方式？',
        "localized_zh": '你想成为名人吗？以什么方式？',
        "en": 'Would you like to be famous? In what way?',
    },
    {
        "id": 3, "group": 1,
        "zh": '在打电话之前，你会先排练要说的话吗？为什么？',
        "localized_zh": '在打电话之前，你会先排练要说的话吗？为什么？',
        "en": 'Before making a telephone call, do you ever rehearse what you are going to say? Why?',
    },
    {
        "id": 4, "group": 1,
        "zh": '对你来说，一个完美的一天是什么样的？',
        "localized_zh": '对你来说，一个完美的一天是什么样的？',
        "en": 'What would constitute a perfect day for you?',
    },
    {
        "id": 5, "group": 1,
        "zh": '你上次一个人唱歌是什么时候？给别人唱呢？',
        "localized_zh": '你上次一个人唱歌是什么时候？给别人唱呢？',
        "en": 'When did you last sing to yourself? To someone else?',
    },
    {
        "id": 6, "group": 1,
        "zh": '如果你能活到90岁，保持30岁时的心智或身体，你会选哪个？',
        "localized_zh": '如果你能活到90岁，保持30岁时的心智或身体，你会选哪个？',
        "en": 'If you could live to 90 and retain either the mind or body of a 30-year-old, which would you want?',
    },
    {
        "id": 7, "group": 1,
        "zh": '你有没有预感自己会怎么死？',
        "localized_zh": '你觉得自己大概会以什么方式离开这个世界？不用太认真，随便聊聊。',
        "en": 'Do you have a secret hunch about how you will die?',
    },
    {
        "id": 8, "group": 1,
        "zh": '说出你和对方三个共同点。',
        "localized_zh": '说出你和对方三个共同点。',
        "en": 'Name three things you and your partner appear to have in common.',
    },
    {
        "id": 9, "group": 1,
        "zh": '你这辈子最感激什么？',
        "localized_zh": '你这辈子最感激什么？',
        "en": 'For what in your life do you feel most grateful?',
    },
    {
        "id": 10, "group": 1,
        "zh": '如果可以改变自己的成长方式，你希望改变什么？',
        "localized_zh": '如果可以改变自己的成长方式，你希望改变什么？',
        "en": 'If you could change anything about the way you were raised, what would it be?',
    },
    {
        "id": 11, "group": 1,
        "zh": '用四分钟，尽可能详细地告诉对方你的人生故事。',
        "localized_zh": '用四分钟，尽可能详细地告诉对方你的人生故事。',
        "en": 'Take four minutes and tell your partner your life story in as much detail as possible.',
    },
    {
        "id": 12, "group": 1,
        "zh": '如果明天早上你醒来拥有某种才能或能力，会是什么？',
        "localized_zh": '如果明天早上你醒来拥有某种才能或能力，会是什么？',
        "en": 'If you could wake up tomorrow having gained any one quality or ability, what would it be?',
    },
    {
        "id": 13, "group": 2,
        "zh": '如果有个水晶球能告诉你关于自己、人生或未来的真相，你想知道什么？',
        "localized_zh": '如果有个水晶球能告诉你关于自己、人生或未来的真相，你想知道什么？',
        "en": 'If a crystal ball could tell you the truth about yourself, your life, the future or anything else, what would you want to know?',
    },
    {
        "id": 14, "group": 2,
        "zh": '有没有什么事是你一直想做，但还没有做到的？为什么没做？',
        "localized_zh": '有没有什么事是你一直想做，但还没有做到的？为什么没做？',
        "en": "Is there something that you've dreamed of doing for a long time? Why haven't you done it?",
    },
    {
        "id": 15, "group": 2,
        "zh": '你一生中最大的成就是什么？',
        "localized_zh": '你一生中最大的成就是什么？',
        "en": 'What is the greatest accomplishment of your life?',
    },
    {
        "id": 16, "group": 2,
        "zh": '在友谊中，你最看重什么？',
        "localized_zh": '在友谊中，你最看重什么？',
        "en": 'What do you value most in a friendship?',
    },
    {
        "id": 17, "group": 2,
        "zh": '你最珍贵的记忆是什么？',
        "localized_zh": '你最珍贵的记忆是什么？',
        "en": 'What is your most treasured memory?',
    },
    {
        "id": 18, "group": 2,
        "zh": '你最糟糕的记忆是什么？',
        "localized_zh": '你有什么经历，让你后来想起来会有些难过，但也让你成长了？',
        "en": 'What is your most terrible memory?',
    },
    {
        "id": 19, "group": 2,
        "zh": '如果你知道自己一年后会突然去世，你会改变现在的生活方式吗？为什么？',
        "localized_zh": '如果你知道未来一年会是人生中最重要的一年，你会怎么过？',
        "en": 'If you knew that in one year you would die suddenly, would you change anything about the way you are now living? Why?',
    },
    {
        "id": 20, "group": 2,
        "zh": '友情对你意味着什么？',
        "localized_zh": '友情对你意味着什么？',
        "en": 'What does friendship mean to you?',
    },
    {
        "id": 21, "group": 2,
        "zh": '爱和感情在你的生活中扮演什么角色？',
        "localized_zh": '爱和感情在你的生活中扮演什么角色？',
        "en": 'What roles do love and affection play in your life?',
    },
    {
        "id": 22, "group": 2,
        "zh": '轮流分享你认为对方的五个优点。',
        "localized_zh": '轮流分享你认为对方的五个优点。',
        "en": 'Alternate sharing something you consider a positive characteristic of your partner. Do this five times.',
    },
    {
        "id": 23, "group": 2,
        "zh": '你的家庭关系亲密温暖吗？你的童年比别人快乐吗？',
        "localized_zh": '你的家庭关系亲密温暖吗？你的童年比别人快乐吗？',
        "en": "How close and warm is your family? Do you feel your childhood was happier than most other people's?",
    },
    {
        "id": 24, "group": 2,
        "zh": '你和妈妈的关系怎么样？',
        "localized_zh": '你和妈妈的关系怎么样？',
        "en": 'How do you feel about your relationship with your mother?',
    },
    {
        "id": 25, "group": 3,
        "zh": '用我们各造三个真实的句子，比如我们在这个房间里都感到......',
        "localized_zh": '用我们各造三个真实的句子，比如我们在这个房间里都感到......',
        "en": "Make three true 'we' statements each. For instance, 'We are both in this room feeling...'",
    },
    {
        "id": 26, "group": 3,
        "zh": "完成这个句子：'我希望有人能和我一起......'",
        "localized_zh": "完成这个句子：'我希望有人能和我一起......'",
        "en": "Complete this sentence: 'I wish I had someone with whom I could share...'",
    },
    {
        "id": 27, "group": 3,
        "zh": '如果你将来和对方成为好友，你希望对方了解你什么？',
        "localized_zh": '如果你将来和对方成为好友，你希望对方了解你什么？',
        "en": 'If you were going to become a close friend with your partner, please share what would be important for him or her to know.',
    },
    {
        "id": 28, "group": 3,
        "zh": '告诉对方你喜欢他/她什么——真实地说，说一些你通常不会对刚认识的人说的话。',
        "localized_zh": '告诉对方你喜欢他/她什么——真实地说，说一些你通常不会对刚认识的人说的话。',
        "en": "Tell your partner what you like about them; be very honest this time, saying things that you might not say to someone you've just met.",
    },
    {
        "id": 29, "group": 3,
        "zh": '分享一件让你感到尴尬的事。',
        "localized_zh": '分享一件让你感到尴尬的事。',
        "en": 'Share with your partner an embarrassing moment in your life.',
    },
    {
        "id": 30, "group": 3,
        "zh": '你上次在另一个人面前哭是什么时候？一个人哭呢？',
        "localized_zh": '你上次在另一个人面前哭是什么时候？一个人哭呢？',
        "en": 'When did you last cry in front of another person? By yourself?',
    },
    {
        "id": 31, "group": 3,
        "zh": '告诉对方你已经喜欢他/她的什么。',
        "localized_zh": '告诉对方你已经喜欢他/她的什么。',
        "en": 'Tell your partner something that you like about them already.',
    },
    {
        "id": 32, "group": 3,
        "zh": '对你来说，什么是不能开玩笑的，如果有的话？',
        "localized_zh": '对你来说，什么是不能开玩笑的，如果有的话？',
        "en": 'What, if anything, is too serious to be joked about?',
    },
    {
        "id": 33, "group": 3,
        "zh": '如果今晚你就要死去，没有机会和任何人交流，你最后悔没有告诉谁什么？',
        "localized_zh": '如果明天你要离开现在的城市，永远不再回来，你最想在离开前做什么？',
        "en": "If you were to die this evening with no opportunity to communicate with anyone, what would you most regret not having told someone? Why haven't you told them yet?",
    },
    {
        "id": 34, "group": 3,
        "zh": '你的房子着火了，救出家人和宠物后，你会取出什么最后一件物品？',
        "localized_zh": '你的房子着火了，救出家人和宠物后，你会取出什么最后一件物品？',
        "en": 'Your house, containing everything you own, catches fire. After saving your loved ones and pets, you have time to safely make a final dash to save any one item. What would it be? Why?',
    },
    {
        "id": 35, "group": 3,
        "zh": '在你的家庭成员中，谁的去世对你的打击最大？为什么？',
        "localized_zh": '在你的家人中，谁对你影响最深？为什么？',
        "en": 'Of all the people in your family, whose death would you find most disturbing? Why?',
    },
    {
        "id": 36, "group": 3,
        "zh": '分享一个个人问题，请对方给你一些建议，并请对方反映你对这个问题的感受。',
        "localized_zh": '分享一个个人问题，请对方给你一些建议，并请对方反映你对这个问题的感受。',
        "en": "Share a personal problem and ask your partner's advice on how he or she might handle it. Also, ask your partner to reflect back to you how you seem to be feeling about the problem you have chosen.",
    },
]

ROUND_RANGES: dict[int, range] = {
    1: range(1, 13),
    2: range(13, 25),
    3: range(25, 37),
}


def get_questions_for_round(round_number: int) -> list[dict]:
    """Return all questions for the given round (1, 2, or 3)."""
    ids = ROUND_RANGES[round_number]
    return [q for q in QUESTIONS if q["id"] in ids]


def get_question(question_id: int) -> Optional[dict]:
    """Return a single question by ID, or None if not found."""
    return next((q for q in QUESTIONS if q["id"] == question_id), None)
