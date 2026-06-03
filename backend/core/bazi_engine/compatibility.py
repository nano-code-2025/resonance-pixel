from .constants import (
    STEM_ELEMENT, ELEMENT_GENERATES, ELEMENT_CONTROLS,
    BRANCH_SIX_HARMONY, BRANCH_THREE_HARMONY, BRANCH_SIX_CLASH,
)


class BaziCompatibility:
    """
    传统八字合婚打分。满分100，基础分50。
    评估维度：日主五行关系、地支六合、地支六冲、三合局。
    """

    def score(self, bazi_a: dict, bazi_b: dict) -> dict:
        points = 50
        highlights: list[str] = []   # 契合点
        cautions: list[str] = []     # 注意点

        elem_a = bazi_a['day_master_element']
        elem_b = bazi_b['day_master_element']

        # --- 日主五行关系 ---
        if ELEMENT_GENERATES.get(elem_a) == elem_b:
            points += 20
            highlights.append(f"日主{elem_a}生{elem_b}，你天然滋养对方，感情有扶持感")
        elif ELEMENT_GENERATES.get(elem_b) == elem_a:
            points += 20
            highlights.append(f"日主{elem_b}生{elem_a}，对方天然呵护你，感情有依托感")
        elif elem_a == elem_b:
            points += 10
            highlights.append(f"同为{elem_a}日主，志趣相投，容易产生共鸣")
        elif ELEMENT_CONTROLS.get(elem_a) == elem_b or ELEMENT_CONTROLS.get(elem_b) == elem_a:
            points -= 15
            cautions.append(f"日主五行相克（{elem_a}与{elem_b}），性格上需要磨合与包容")

        # --- 地支六合 ---
        branches_a = [p['zhi'] for p in bazi_a['pillars'].values()]
        branches_b = [p['zhi'] for p in bazi_b['pillars'].values()]
        harmony_count = 0
        for za in branches_a:
            for zb in branches_b:
                if frozenset({za, zb}) in BRANCH_SIX_HARMONY:
                    harmony_count += 1
                    highlights.append(f"地支六合（{za}与{zb}合），缘分深厚")
        points += min(harmony_count * 8, 20)  # 最多加20分

        # --- 地支六冲 ---
        clash_count = 0
        for za in branches_a:
            for zb in branches_b:
                if frozenset({za, zb}) in BRANCH_SIX_CLASH:
                    clash_count += 1
                    cautions.append(f"地支相冲（{za}与{zb}冲），某些时期容易摩擦，需要包容")
        points -= min(clash_count * 10, 20)  # 最多扣20分

        # --- 三合局（两人合力成局） ---
        all_branches = set(branches_a + branches_b)
        for trio in BRANCH_THREE_HARMONY:
            if all(b in all_branches for b in trio):
                points += 10
                highlights.append(f"合成{''.join(trio)}三合局，整体运势相辅相成")

        points = max(0, min(100, points))

        return {
            'score': points,
            'highlights': highlights,
            'cautions': cautions,
        }
