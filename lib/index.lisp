macro
	(and a b) (let v a (if v b v))
	(or  a b) (let v a (if v v b))
	(or (echo 1) (echo 2))
;letrec
;	(printList a)
;		(if (list? a)
;			{
;				(printList (head a))
;				(echo (tail a))
;			}
;			0)
;	(printList [1 2 3 4])
