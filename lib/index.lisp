macro
	(ADD a b) (a + b)
	(echo (ADD (ADD 1 2) 3))
;letrec
;	(printList a)
;		(if (list? a)
;			{
;				(printList (head a))
;				(echo (tail a))
;			}
;			0)
;	(printList [1 2 3 4])
