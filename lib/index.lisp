letrec
	printArgs (\ a {
		(echo a)
		printArgs
	})
	printList (\ a
		(if (pair? a) {
			(printList (head a))
			(echo (tail a))
		})
	)
	{
		(printArgs 1 2 3 4 5)
		(printList [1 2])
	}
