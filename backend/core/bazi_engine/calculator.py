from lunar_python import Solar
from .constants import (
    STEM_ELEMENT, BRANCH_ELEMENT, SHICHEN_TO_HOUR, DAY_MASTER_TRAITS
)


class BaziCalculator:
    def calculate(self, year: int, month: int, day: int, shichen: str) -> dict:
        """
        计算四柱八字及五行分布。
        shichen: 时辰汉字，如 '子', '午' 等
        """
        hour = SHICHEN_TO_HOUR.get(shichen, 12)
        solar = Solar.fromYmdHms(year, month, day, hour, 0, 0)
        lunar = solar.getLunar()
        bazi = lunar.getEightChar()

        pillars = {
            'year':  {'gan': bazi.getYearGan(),  'zhi': bazi.getYearZhi()},
            'month': {'gan': bazi.getMonthGan(), 'zhi': bazi.getMonthZhi()},
            'day':   {'gan': bazi.getDayGan(),   'zhi': bazi.getDayZhi()},
            'hour':  {'gan': bazi.getTimeGan(),  'zhi': bazi.getTimeZhi()},
        }

        day_master = pillars['day']['gan']
        day_master_element = STEM_ELEMENT[day_master]

        # 统计五行分布（天干+地支各算1分，共8分）
        element_count: dict[str, int] = {'木': 0, '火': 0, '土': 0, '金': 0, '水': 0}
        for pillar in pillars.values():
            element_count[STEM_ELEMENT[pillar['gan']]] += 1
            element_count[BRANCH_ELEMENT[pillar['zhi']]] += 1

        # 缺失五行
        missing_elements = [e for e, cnt in element_count.items() if cnt == 0]

        return {
            'pillars': pillars,
            'day_master': day_master,
            'day_master_element': day_master_element,
            'day_master_trait': DAY_MASTER_TRAITS.get(day_master, ''),
            'element_count': element_count,
            'missing_elements': missing_elements,
            # 供前端展示的字符串，如 "壬午 甲子 丁亥 庚申"
            'display': ' '.join(
                f"{p['gan']}{p['zhi']}" for p in pillars.values()
            ),
        }
