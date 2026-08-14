# Five-case blinded pilot

Pilot cases (structural selection only):

| caseId | why |
|---|---|
| female-1991-09-21-dau | seed; VCD; Tuần+Triệt; Cơ Nguyệt Đồng Lương + Sát Phá Tham; female Dậu |
| case-b89009044b5d | first non-VCD; Tử Phủ Vũ Tướng; brightness-strong; male Ngọ |
| case-9341452b3b01 | VCD; hour Tý; different date |
| case-2fc75a13ce4c | non-VCD; hour Dần |
| case-e713b1b147c4 | VCD; hour Thìn; Cơ Nguyệt Đồng Lương |

Goals: rubric clarity, pack completeness, burden, unable-to-judge rate, overlap mechanics, support vs netQuality, stability vs activation.

Success → set `pilot-state.v1.json` `accepted: true` (**PILOT_ACCEPTED**). That is not calibration.

If the rubric changes materially, bump `rubricVersion` and keep old reviews with their version. Incompatible old reviews must not enter calibration.

Do not tune coefficients from the pilot.
